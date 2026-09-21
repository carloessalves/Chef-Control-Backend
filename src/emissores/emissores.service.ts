import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService, ActorAuditoria } from '../auditoria/auditoria.service.js';
import { SyncOutboxService } from '../sync-outbox/sync-outbox.service.js'; // 🆕
import { CreateEmissorDto } from './dto/create-emissor.dto.js';
import { UpdateEmissorDto } from './dto/update-emissor.dto.js';
import { Prisma, TipoEvento, EntidadeAuditoria, SyncOutboxTipo } from '@prisma/client'; // 🆕 SyncOutboxTipo

@Injectable()
export class EmissoresService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
    private syncOutbox: SyncOutboxService, // 🆕
  ) {}

  // Fluxo operacional (tablet, sem login) — unidadeId vem do dispositivo
  async create(
    dto: CreateEmissorDto,
    unidadeId: string,
    actor: ActorAuditoria,
  ) {
    await this.validarUnidade(unidadeId);

    return this.prisma.$transaction(async (tx) => {
      const emissor = await tx.emissor.create({
        data: {
          nome: dto.nome,
          funcao: dto.funcao,
          unidadeId,
          ativo: dto.ativo ?? true,
        },
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.CREATE,
          entidade: EntidadeAuditoria.Emissor,
          entidadeId: emissor.id,
          dadosDepois: emissor,
        },
        tx,
      );

      // 🆕 Enfileira para sincronização com o cloud (no-op se SERVER_MODE=cloud)
      await this.syncOutbox.enfileirar(
        SyncOutboxTipo.CRIAR_EMISSOR,
        emissor,
        tx,
      );

      return emissor;
    });
  }

  async findAll(unidadeId: string) {
    return this.prisma.emissor.findMany({
      where: { unidadeId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, unidadeId: string) {
    const emissor = await this.prisma.emissor.findFirst({
      where: { id, unidadeId },
    });
    if (!emissor) {
      throw new NotFoundException('Emissor não encontrado');
    }
    return emissor;
  }

  // Fluxo administrativo (login, ADMIN) — sem restrição de unidade,
  // pois ADMIN pode gerenciar qualquer unidade.
  async findOneAdmin(id: string) {
    const emissor = await this.prisma.emissor.findUnique({
      where: { id },
      include: { unidade: true },
    });
    if (!emissor) {
      throw new NotFoundException('Emissor não encontrado');
    }
    return emissor;
  }

  async update(id: string, dto: UpdateEmissorDto, actor: ActorAuditoria) {
    const antes = await this.findOneAdmin(id);

    return this.prisma.$transaction(async (tx) => {
      const depois = await tx.emissor.update({
        where: { id },
        data: dto,
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.UPDATE,
          entidade: EntidadeAuditoria.Emissor,
          entidadeId: id,
          dadosAntes: antes,
          dadosDepois: depois,
        },
        tx,
      );

      // 🆕 Enfileira atualização para sincronização com o cloud
      await this.syncOutbox.enfileirar(
        SyncOutboxTipo.ATUALIZAR_EMISSOR,
        depois,
        tx,
      );

      return depois;
    });
  }

  async remove(id: string, actor: ActorAuditoria) {
    const antes = await this.findOneAdmin(id);

    return this.prisma.$transaction(async (tx) => {
      // Soft delete — mantém histórico de etiquetas emitidas
      const depois = await tx.emissor.update({
        where: { id },
        data: { ativo: false },
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.DELETE,
          entidade: EntidadeAuditoria.Emissor,
          entidadeId: id,
          dadosAntes: antes,
          dadosDepois: depois,
        },
        tx,
      );

      // 🆕 remove() é um soft delete (update de `ativo`), então também deve
      // sincronizar como ATUALIZAR_EMISSOR — o cloud precisa saber que o
      // emissor foi inativado.
      await this.syncOutbox.enfileirar(
        SyncOutboxTipo.ATUALIZAR_EMISSOR,
        depois,
        tx,
      );

      return depois;
    });
  }

  // ---------- Helpers ----------

  private async validarUnidade(unidadeId: string) {
    const unidade = await this.prisma.unidade.findFirst({
      where: { id: unidadeId, ativo: true },
    });

    if (!unidade) {
      throw new NotFoundException('Unidade não encontrada ou inativa.');
    }
  }
}

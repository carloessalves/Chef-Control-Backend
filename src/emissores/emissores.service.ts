import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService, ActorAuditoria } from '../auditoria/auditoria.service.js';
import { SyncOutboxService } from '../sync-outbox/sync-outbox.service.js';
import { SyncOutboxWorkerService } from '../sync-outbox/sync-outbox-worker.service.js'; // 🆕
import { CreateEmissorDto } from './dto/create-emissor.dto.js';
import { UpdateEmissorDto } from './dto/update-emissor.dto.js';
import { Prisma, TipoEvento, EntidadeAuditoria, SyncOutboxTipo } from '@prisma/client';

@Injectable()
export class EmissoresService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
    private syncOutbox: SyncOutboxService,
    private syncOutboxWorker: SyncOutboxWorkerService, // 🆕
  ) {}

  async create(dto: CreateEmissorDto, unidadeId: string, actor: ActorAuditoria) {
    await this.validarUnidade(unidadeId);

    const resultado = await this.prisma.$transaction(async (tx) => {
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

      await this.syncOutbox.enfileirar(SyncOutboxTipo.CRIAR_EMISSOR, emissor, tx);

      return emissor;
    });

    this.syncOutboxWorker.dispararProcessamentoOtimista(); // 🆕
    return resultado;
  }

  async findAll(unidadeId: string) {
    return this.prisma.emissor.findMany({
      where: { unidadeId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, unidadeId: string) {
    const emissor = await this.prisma.emissor.findFirst({ where: { id, unidadeId } });
    if (!emissor) throw new NotFoundException('Emissor não encontrado');
    return emissor;
  }

  async findOneAdmin(id: string) {
    const emissor = await this.prisma.emissor.findUnique({
      where: { id },
      include: { unidade: true },
    });
    if (!emissor) throw new NotFoundException('Emissor não encontrado');
    return emissor;
  }

  async update(id: string, dto: UpdateEmissorDto, actor: ActorAuditoria) {
    const antes = await this.findOneAdmin(id);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const depois = await tx.emissor.update({ where: { id }, data: dto });

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

      await this.syncOutbox.enfileirar(SyncOutboxTipo.ATUALIZAR_EMISSOR, depois, tx);

      return depois;
    });

    this.syncOutboxWorker.dispararProcessamentoOtimista(); // 🆕
    return resultado;
  }

  async remove(id: string, actor: ActorAuditoria) {
    const antes = await this.findOneAdmin(id);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const depois = await tx.emissor.update({ where: { id }, data: { ativo: false } });

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

      await this.syncOutbox.enfileirar(SyncOutboxTipo.ATUALIZAR_EMISSOR, depois, tx);

      return depois;
    });

    this.syncOutboxWorker.dispararProcessamentoOtimista(); // 🆕
    return resultado;
  }

  /** 🆕 Usado exclusivamente pelos endpoints POST/PATCH /emissores/sync (SyncApiKeyGuard). */
  async upsertParaSync(payload: any) {
    return this.prisma.emissor.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        nome: payload.nome,
        funcao: payload.funcao,
        unidadeId: payload.unidadeId,
        ativo: payload.ativo ?? true,
      },
      update: {
        nome: payload.nome,
        funcao: payload.funcao,
        ativo: payload.ativo,
      },
    });
  }

  private async validarUnidade(unidadeId: string) {
    const unidade = await this.prisma.unidade.findFirst({ where: { id: unidadeId, ativo: true } });
    if (!unidade) throw new NotFoundException('Unidade não encontrada ou inativa.');
  }
}

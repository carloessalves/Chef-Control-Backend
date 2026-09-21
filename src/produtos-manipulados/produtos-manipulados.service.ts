import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService, ActorAuditoria } from '../auditoria/auditoria.service.js';
import { SyncOutboxService } from '../sync-outbox/sync-outbox.service.js'; // 🆕
import { SyncOutboxWorkerService } from '../sync-outbox/sync-outbox-worker.service.js'; // 🆕
import { CreateProdutoManipuladoDto } from './dto/create-produto-manipulado.dto.js';
import { UpdateProdutoManipuladoDto } from './dto/update-produto-manipulado.dto.js';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Prisma, TipoEvento, EntidadeAuditoria, ProdutoManipulado, SyncOutboxTipo } from '@prisma/client'; // 🆕

@Injectable()
export class ProdutosManipuladosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly syncOutbox: SyncOutboxService, // 🆕
    private readonly syncOutboxWorker: SyncOutboxWorkerService, // 🆕
  ) {}

  async create(dto: CreateProdutoManipuladoDto, unidadeId: string, actor: ActorAuditoria) {
    await this.validarUnidade(unidadeId);
    if (dto.categoriaId) await this.validarCategoria(dto.categoriaId);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const produto = await tx.produtoManipulado.create({
        data: {
          nome: dto.nome,
          categoriaId: dto.categoriaId,
          alergenos: dto.alergenos ?? [],
          ativo: dto.ativo ?? true,
          unidadeId,
        },
        include: { categoria: true },
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.CREATE,
          entidade: EntidadeAuditoria.ProdutoManipulado,
          entidadeId: produto.id,
          dadosDepois: produto,
        },
        tx,
      );

      // 🆕 Enfileira para sincronização com o cloud
      await this.syncOutbox.enfileirar(SyncOutboxTipo.CRIAR_PRODUTO, produto, tx);

      return produto;
    });

    this.syncOutboxWorker.dispararProcessamentoOtimista(); // 🆕
    return resultado;
  }

  async findAll(unidadeId: string) {
    return this.prisma.produtoManipulado.findMany({
      where: { unidadeId, ativo: true },
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, unidadeId: string) {
    return this.buscarOuFalhar(id, unidadeId, true);
  }

  async update(id: string, dto: UpdateProdutoManipuladoDto, unidadeId: string, actor: ActorAuditoria) {
    const antes = await this.buscarOuFalhar(id, unidadeId, true);
    if (dto.categoriaId) await this.validarCategoria(dto.categoriaId);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const depois = await tx.produtoManipulado.update({
        where: { id },
        data: dto,
        include: { categoria: true },
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.UPDATE,
          entidade: EntidadeAuditoria.ProdutoManipulado,
          entidadeId: id,
          dadosAntes: antes,
          dadosDepois: depois,
        },
        tx,
      );

      // 🆕 Enfileira atualização para sincronização com o cloud
      await this.syncOutbox.enfileirar(SyncOutboxTipo.ATUALIZAR_PRODUTO, depois, tx);

      return depois;
    });

    this.syncOutboxWorker.dispararProcessamentoOtimista(); // 🆕
    return resultado;
  }

  async remove(id: string, user: AuthenticatedUser) {
    const produto = await this.buscarOuFalhar(id, user.unidadeId, false);

    const resultado = await this.prisma.$transaction(async (tx) => {
      const depois = await tx.produtoManipulado.update({
        where: { id },
        data: { ativo: false },
      });

      await this.auditoria.registrar(
        {
          usuarioId: user.sub,
          papelNoMomento: user.papel,
          tipoEvento: TipoEvento.DELETE,
          entidade: EntidadeAuditoria.ProdutoManipulado,
          entidadeId: id,
          dadosAntes: produto,
          dadosDepois: depois,
        },
        tx,
      );

      // 🆕 soft delete também é uma atualização — precisa sincronizar
      await this.syncOutbox.enfileirar(SyncOutboxTipo.ATUALIZAR_PRODUTO, depois, tx);

      return depois;
    });

    this.syncOutboxWorker.dispararProcessamentoOtimista(); // 🆕
    return resultado;
  }

  async findAllAdmin(unidadeId: string, incluirInativos: boolean) {
    return this.prisma.produtoManipulado.findMany({
      where: { unidadeId, ...(incluirInativos ? {} : { ativo: true }) },
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }

  /**
   * 🆕 Usado exclusivamente pelos endpoints POST/PATCH /produtos-manipulados/sync.
   * O payload vindo do outbox inclui a relação `categoria` (via include no create/
   * update originais) — ela é ignorada aqui pois listamos os campos explicitamente.
   */
  async upsertParaSync(payload: any) {
    return this.prisma.produtoManipulado.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        nome: payload.nome,
        categoriaId: payload.categoriaId ?? null,
        alergenos: payload.alergenos ?? [],
        ativo: payload.ativo ?? true,
        unidadeId: payload.unidadeId,
      },
      update: {
        nome: payload.nome,
        categoriaId: payload.categoriaId ?? null,
        alergenos: payload.alergenos ?? [],
        ativo: payload.ativo,
      },
    });
  }

  private async buscarOuFalhar(
    id: string,
    unidadeId: string,
    comCategoria: boolean,
  ): Promise<ProdutoManipulado> {
    const produto = await this.prisma.produtoManipulado.findFirst({
      where: { id, unidadeId },
      ...(comCategoria ? { include: { categoria: true } } : {}),
    });
    if (!produto) throw new NotFoundException('Produto não encontrado.');
    return produto;
  }

  private async validarUnidade(unidadeId: string) {
    const unidade = await this.prisma.unidade.findFirst({ where: { id: unidadeId, ativo: true } });
    if (!unidade) throw new NotFoundException('Unidade não encontrada ou inativa.');
  }

  private async validarCategoria(categoriaId: string) {
    const categoria = await this.prisma.categoriaProduto.findFirst({ where: { id: categoriaId, ativo: true } });
    if (!categoria) throw new NotFoundException('Categoria de produto não encontrada ou inativa.');
  }
}

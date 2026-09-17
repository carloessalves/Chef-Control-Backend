import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService, ActorAuditoria } from '../auditoria/auditoria.service.js';
import { CreateProdutoManipuladoDto } from './dto/create-produto-manipulado.dto.js';
import { UpdateProdutoManipuladoDto } from './dto/update-produto-manipulado.dto.js';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Prisma, TipoEvento, EntidadeAuditoria, ProdutoManipulado } from '@prisma/client';

@Injectable()
export class ProdutosManipuladosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  // ---------- Fluxo operacional (tablet, sem login) ----------

  async create(
    dto: CreateProdutoManipuladoDto,
    unidadeId: string,
    actor: ActorAuditoria,
  ) {
    await this.validarUnidade(unidadeId);

    if (dto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
    }

    return this.prisma.$transaction(async (tx) => {
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

      return produto;
    });
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

  async update(
    id: string,
    dto: UpdateProdutoManipuladoDto,
    unidadeId: string,
    actor: ActorAuditoria,
  ) {
    const antes = await this.buscarOuFalhar(id, unidadeId, true); // valida existência + escopo da unidade

    if (dto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
    }

    return this.prisma.$transaction(async (tx) => {
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

      return depois;
    });
  }

  // ---------- Fluxo administrativo (login, ADMIN) ----------

  /** Exclusão (soft delete) é ação sensível: só ADMIN, via JWT. */
  async remove(id: string, user: AuthenticatedUser) {
    const produto = await this.buscarOuFalhar(id, user.unidadeId, false);

    return this.prisma.$transaction(async (tx) => {
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

      return depois;
    });
  }

  async findAllAdmin(unidadeId: string, incluirInativos: boolean) {
    return this.prisma.produtoManipulado.findMany({
      where: {
       unidadeId,
        ...(incluirInativos ? {} : { ativo: true }),
      },
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }
  
  // ---------- Helpers ----------

  /**
   * Busca um produto manipulado por id + unidadeId, lançando NotFoundException
   * caso não exista. Centraliza a lógica repetida entre findOne, update e remove.
   */
  private async buscarOuFalhar(
    id: string,
    unidadeId: string,
    comCategoria: boolean,
  ): Promise<ProdutoManipulado> {
    const produto = await this.prisma.produtoManipulado.findFirst({
      where: { id, unidadeId },
      ...(comCategoria ? { include: { categoria: true } } : {}),
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return produto;
  }

  private async validarUnidade(unidadeId: string) {
    const unidade = await this.prisma.unidade.findFirst({
      where: { id: unidadeId, ativo: true },
    });

    if (!unidade) {
      throw new NotFoundException('Unidade não encontrada ou inativa.');
    }
  }

  private async validarCategoria(categoriaId: string) {
    const categoria = await this.prisma.categoriaProduto.findFirst({
      where: { id: categoriaId, ativo: true },
    });

    if (!categoria) {
      throw new NotFoundException(
        'Categoria de produto não encontrada ou inativa.',
      );
    }
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService, ActorAuditoria } from '../auditoria/auditoria.service.js';
import { CreateCategoriaProdutoDto } from './dto/create-categoria-produto.dto.js';
import { UpdateCategoriaProdutoDto } from './dto/update-categoria-produto.dto.js';
import { Prisma, TipoEvento, EntidadeAuditoria } from '@prisma/client';

@Injectable()
export class CategoriasProdutoService {
  constructor(
    private prisma: PrismaService,
    private auditoria: AuditoriaService,
  ) {}

  async create(dto: CreateCategoriaProdutoDto, actor: ActorAuditoria) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const categoria = await tx.categoriaProduto.create({
          data: {
            nome: dto.nome,
            ativo: dto.ativo ?? true,
          },
        });

        await this.auditoria.registrar(
          {
            ...actor,
            tipoEvento: TipoEvento.CREATE,
            entidade: EntidadeAuditoria.CategoriaProduto,
            entidadeId: categoria.id,
            dadosDepois: categoria,
          },
          tx,
        );

        return categoria;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
      throw error;
    }
  }

  async findAll(apenasAtivas?: boolean) {
    return this.prisma.categoriaProduto.findMany({
      where: apenasAtivas ? { ativo: true } : undefined,
      orderBy: { nome: 'asc' },
      include: {
        _count: { select: { produtos: true } },
      },
    });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoriaProduto.findUnique({
      where: { id },
      include: { produtos: true },
    });

    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return categoria;
  }

  async update(
    id: string,
    dto: UpdateCategoriaProdutoDto,
    actor: ActorAuditoria,
  ) {
    const antes = await this.findOne(id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const depois = await tx.categoriaProduto.update({
          where: { id },
          data: dto,
        });

        await this.auditoria.registrar(
          {
            ...actor,
            tipoEvento: TipoEvento.UPDATE,
            entidade: EntidadeAuditoria.CategoriaProduto,
            entidadeId: id,
            dadosAntes: antes,
            dadosDepois: depois,
          },
          tx,
        );

        return depois;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
      throw error;
    }
  }

  async remove(id: string, actor: ActorAuditoria) {
    const antes = await this.findOne(id);

    return this.prisma.$transaction(async (tx) => {
      // Soft delete — mantém histórico de produtos vinculados
      const depois = await tx.categoriaProduto.update({
        where: { id },
        data: { ativo: false },
      });

      await this.auditoria.registrar(
        {
          ...actor,
          tipoEvento: TipoEvento.DELETE,
          entidade: EntidadeAuditoria.CategoriaProduto,
          entidadeId: id,
          dadosAntes: antes,
          dadosDepois: depois,
        },
        tx,
      );

      return depois;
    });
  }
}

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProdutoManipuladoDto } from './dto/create-produto-manipulado.dto';
import { UpdateProdutoManipuladoDto } from './dto/update-produto-manipulado.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ProdutosManipuladosService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- Fluxo operacional (tablet, sem login) ----------

  async create(dto: CreateProdutoManipuladoDto, unidadeId: string) {
    if (dto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
    }

    return this.prisma.produtoManipulado.create({
      data: {
        nome: dto.nome,
        categoriaId: dto.categoriaId,
        alergenos: dto.alergenos ?? [],
        ativo: dto.ativo ?? true,
        unidadeId,
      },
      include: { categoria: true },
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
    const produto = await this.prisma.produtoManipulado.findFirst({
      where: { id, unidadeId },
      include: { categoria: true },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return produto;
  }

  async update(
    id: string,
    dto: UpdateProdutoManipuladoDto,
    unidadeId: string,
  ) {
    await this.findOne(id, unidadeId); // valida existência + escopo da unidade

    if (dto.categoriaId) {
      await this.validarCategoria(dto.categoriaId);
    }

    return this.prisma.produtoManipulado.update({
      where: { id },
      data: dto,
      include: { categoria: true },
    });
  }

  // ---------- Fluxo administrativo (login, ADMIN) ----------

  /** Exclusão (soft delete) é ação sensível: só ADMIN, via JWT. */
  async remove(id: string, user: AuthenticatedUser) {
    const produto = await this.prisma.produtoManipulado.findFirst({
      where: { id, unidadeId: user.unidadeId },
    });

    if (!produto) {
      throw new NotFoundException('Produto não encontrado.');
    }

    return this.prisma.produtoManipulado.update({
      where: { id },
      data: { ativo: false },
    });
  }

  // ---------- Helpers ----------

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

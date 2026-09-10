import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaProdutoDto } from './dto/create-categoria-produto.dto.js';
import { UpdateCategoriaProdutoDto } from './dto/update-categoria-produto.dto.js';

@Injectable()
export class CategoriasProdutoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoriaProdutoDto) {
    const existente = await this.prisma.categoriaProduto.findUnique({
      where: { nome: dto.nome },
    });
    if (existente) {
      throw new ConflictException('Já existe uma categoria com esse nome');
    }

    return this.prisma.categoriaProduto.create({
      data: {
        nome: dto.nome,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll(apenasAtivas?: boolean) {
    return this.prisma.categoriaProduto.findMany({
      where: apenasAtivas ? { ativo: true } : undefined,
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    let categoria;
    try {
      categoria = await this.prisma.categoriaProduto.findUnique({
        where: { id },
        include: { produtos: true },
      });
    } catch {
      throw new NotFoundException('Categoria não encontrada');
    }
    if (!categoria) {
      throw new NotFoundException('Categoria não encontrada');
    }
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaProdutoDto) {
    await this.findOne(id);

    if (dto.nome) {
      const existente = await this.prisma.categoriaProduto.findUnique({
        where: { nome: dto.nome },
      });
      if (existente && existente.id !== id) {
        throw new ConflictException('Já existe uma categoria com esse nome');
      }
    }

    return this.prisma.categoriaProduto.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    // Soft delete — mantém histórico de produtos vinculados
    return this.prisma.categoriaProduto.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

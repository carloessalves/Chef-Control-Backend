// src/produtos/produtos.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { UpdateProdutoDto } from './dto/update-produto.dto.js';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateProdutoDto) {
    return this.prisma.produto.create({ data: dto });
  }

  findAll() {
    return this.prisma.produto.findMany({
      include: { categoria: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: { categoria: true },
    });
    if (!produto) throw new NotFoundException('Produto não encontrado');
    return produto;
  }

  findByCategoria(categoriaId: string) {
    return this.prisma.produto.findMany({
      where: { categoriaId },
      orderBy: { nome: 'asc' },
    });
  }

  async update(id: string, dto: UpdateProdutoDto) {
    await this.findOne(id);
    return this.prisma.produto.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.produto.delete({ where: { id } });
  }
}

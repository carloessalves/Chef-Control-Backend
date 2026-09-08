// src/categorias/categorias.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Injectable()
export class CategoriasService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCategoriaDto) {
    return this.prisma.categoria.create({ data: dto });
  }

  findAll() {
    return this.prisma.categoria.findMany({
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoria não encontrada');
    return categoria;
  }

  async update(id: string, dto: UpdateCategoriaDto) {
    await this.findOne(id); // valida existência
    return this.prisma.categoria.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.categoria.delete({ where: { id } });
  }
}

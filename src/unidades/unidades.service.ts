import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUnidadeDto } from './dto/create-unidade.dto.js';
import { UpdateUnidadeDto } from './dto/update-unidade.dto.js';


@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnidadeDto) {
    return this.prisma.unidade.create({ data: dto });
  }

  async findAll(includeInativas = false) {
    return this.prisma.unidade.findMany({
      where: includeInativas ? {} : { ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string) {
    const unidade = await this.prisma.unidade.findUnique({ where: { id } });
    if (!unidade) {
      throw new NotFoundException(`Unidade com ID ${id} não encontrada.`);
    }
    return unidade;
  }

  async update(id: string, dto: UpdateUnidadeDto) {
    await this.findOne(id); // valida existência
    return this.prisma.unidade.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete: apenas inativa, nunca apaga (integridade referencial com etiquetas/produtos)
    return this.prisma.unidade.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

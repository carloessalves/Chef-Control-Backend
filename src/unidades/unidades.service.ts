import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUnidadeDto } from './dto/create-unidade.dto.js';
import { UpdateUnidadeDto } from './dto/update-unidade.dto.js';

@Injectable()
export class UnidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUnidadeDto) {
    try {
      return await this.prisma.unidade.create({ data: dto });
    } catch (error) {
      this.handleUniqueConstraintError(error, dto.nome);
      throw error;
    }
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

    try {
      return await this.prisma.unidade.update({ where: { id }, data: dto });
    } catch (error) {
      this.handleUniqueConstraintError(error, dto.nome);
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    // Soft delete: apenas inativa, nunca apaga (integridade referencial com etiquetas/produtos)
    return this.prisma.unidade.update({
      where: { id },
      data: { ativo: false },
    });
  }

  /**
   * Traduz o erro de constraint única do Prisma (P2002) em um
   * ConflictException amigável, quando o campo violado for "nome".
   */
  private handleUniqueConstraintError(error: unknown, nome?: string) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      (error.meta?.target as string[])?.includes('nome')
    ) {
      throw new ConflictException(
        `Já existe uma unidade com o nome "${nome}".`,
      );
    }
  }
}

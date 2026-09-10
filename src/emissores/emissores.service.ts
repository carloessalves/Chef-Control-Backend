import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEmissorDto } from './dto/create-emissor.dto.js';
import { UpdateEmissorDto } from './dto/update-emissor.dto.js';

@Injectable()
export class EmissoresService {
  constructor(private prisma: PrismaService) {}

  // Fluxo operacional (tablet, sem login) — unidadeId vem do dispositivo
  async create(dto: CreateEmissorDto, unidadeId: string) {
    return this.prisma.emissor.create({
      data: {
        nome: dto.nome,
        funcao: dto.funcao,
        unidadeId,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll(unidadeId: string) {
    return this.prisma.emissor.findMany({
      where: { unidadeId, ativo: true },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: string, unidadeId: string) {
    const emissor = await this.prisma.emissor.findFirst({
      where: { id, unidadeId },
    });
    if (!emissor) {
      throw new NotFoundException('Emissor não encontrado');
    }
    return emissor;
  }

  // Fluxo administrativo (login, ADMIN) — sem restrição de unidade,
  // pois ADMIN pode gerenciar qualquer unidade.
  async findOneAdmin(id: string) {
    const emissor = await this.prisma.emissor.findUnique({
      where: { id },
      include: { unidade: true },
    });
    if (!emissor) {
      throw new NotFoundException('Emissor não encontrado');
    }
    return emissor;
  }

  async update(id: string, dto: UpdateEmissorDto) {
    await this.findOneAdmin(id);

    return this.prisma.emissor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOneAdmin(id);

    // Soft delete — mantém histórico de etiquetas emitidas
    return this.prisma.emissor.update({
      where: { id },
      data: { ativo: false },
    });
  }
}

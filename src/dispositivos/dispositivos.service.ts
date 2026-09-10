import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';


@Injectable()
export class DispositivosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Chamado pelo app na primeira execução (e em execuções seguintes,
   * para "renovar" o ultimoAcesso). Idempotente.
   */
  async vincular(dto: VincularDispositivoDto, user: AuthenticatedUser) {
    const existente = await this.prisma.dispositivo.findUnique({
      where: { identificador: dto.identificador },
    });

    // Já vinculado a OUTRA unidade -> não deixa "roubar" o dispositivo.
    if (existente && existente.unidadeId !== user.unidadeId) {
      throw new ConflictException(
        'Este dispositivo já está vinculado a outra unidade.',
      );
    }

    return this.prisma.dispositivo.upsert({
      where: { identificador: dto.identificador },
      update: {
        ultimoAcesso: new Date(),
        ...(dto.nome ? { nome: dto.nome } : {}),
      },
      create: {
        identificador: dto.identificador,
        nome: dto.nome,
        unidadeId: user.unidadeId,
        ultimoAcesso: new Date(),
      },
    });
  }

  async findAll(user: AuthenticatedUser) {
    return this.prisma.dispositivo.findMany({
      where: { unidadeId: user.unidadeId },
      orderBy: { ultimoAcesso: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const dispositivo = await this.prisma.dispositivo.findFirst({
      where: { id, unidadeId: user.unidadeId },
    });

    if (!dispositivo) {
      throw new NotFoundException('Dispositivo não encontrado.');
    }

    return dispositivo;
  }

  async update(
    id: string,
    dto: UpdateDispositivoDto,
    user: AuthenticatedUser,
  ) {
    await this.findOne(id, user);

    return this.prisma.dispositivo.update({
      where: { id },
      data: { nome: dto.nome },
    });
  }

  /** Desvincula/revoga o dispositivo (remoção definitiva). */
  async remove(id: string, user: AuthenticatedUser) {
    await this.findOne(id, user);

    return this.prisma.dispositivo.delete({ where: { id } });
  }
}

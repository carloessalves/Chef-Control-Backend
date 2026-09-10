import { Injectable, NotFoundException } from '@nestjs/common';
import { CondicaoArmazenamento, PapelUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RegrasValidadeService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.regraValidade.findMany({
      orderBy: { condicao: 'asc' },
    });
  }

  async atualizar(
    condicao: CondicaoArmazenamento,
    horasValidade: number,
    usuarioId: string,
    papelNoMomento: PapelUsuario,
  ) {
    const regraAntes = await this.prisma.regraValidade.findUnique({
      where: { condicao },
    });

    if (!regraAntes) {
      throw new NotFoundException(
        `Regra para condição "${condicao}" não encontrada.`,
      );
    }

    const [regraDepois] = await this.prisma.$transaction([
      this.prisma.regraValidade.update({
        where: { condicao },
        data: { horasValidade },
      }),
      this.prisma.eventoAuditoria.create({
        data: {
          usuarioId,
          papelNoMomento,
          tipoEvento: 'UPDATE',
          entidade: 'RegraValidade',
          entidadeId: regraAntes.id,
          dadosAntes: { horasValidade: regraAntes.horasValidade },
          dadosDepois: { horasValidade },
        },
      }),
    ]);

    return regraDepois;
  }
}

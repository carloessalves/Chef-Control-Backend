import { Injectable, NotFoundException } from '@nestjs/common';
import { CondicaoArmazenamento, PapelUsuario, TipoEvento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class RegrasValidadeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

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

    // Transação interativa: permite reutilizar o AuditoriaService
    // passando o client transacional (tx) para o registro.
    const regraDepois = await this.prisma.$transaction(async (tx) => {
      const atualizada = await tx.regraValidade.update({
        where: { condicao },
        data: { horasValidade },
      });

      await this.auditoria.registrar(
        {
          usuarioId,
          papelNoMomento,
          tipoEvento: TipoEvento.UPDATE,
          entidade: 'RegraValidade',
          entidadeId: regraAntes.id,
          dadosAntes: { horasValidade: regraAntes.horasValidade },
          dadosDepois: { horasValidade },
        },
        tx,
      );

      return atualizada;
    });

    return regraDepois;
  }
}

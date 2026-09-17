import { Injectable } from '@nestjs/common';
import { Prisma, TipoEvento, PapelUsuario, EntidadeAuditoria } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

export interface ActorAuditoria {
  usuarioId?: string;
  papelNoMomento?: PapelUsuario;
  dispositivoId?: string;
}

interface RegistrarParams extends ActorAuditoria {
  tipoEvento: TipoEvento;
  entidade: EntidadeAuditoria; // <- antes era string
  entidadeId?: string;
  dadosAntes?: unknown;
  dadosDepois?: unknown;
}

export interface ListarAuditoriaParams {
  entidade?: EntidadeAuditoria;
  entidadeId?: string;
  usuarioId?: string;
  tipoEvento?: TipoEvento;
  dataInicio?: Date;
  dataFim?: Date;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(params: RegistrarParams, tx?: Prisma.TransactionClient) {
    const {
      tipoEvento,
      entidade,
      entidadeId,
      usuarioId,
      papelNoMomento,
      dispositivoId,
      dadosAntes,
      dadosDepois,
    } = params;

    const data = {
      tipoEvento,
      entidade,
      entidadeId,
      usuarioId,
      papelNoMomento,
      dispositivoId,
      dadosAntes: dadosAntes as any,
      dadosDepois: dadosDepois as any,
    };

    if (tx) {
      await tx.eventoAuditoria.create({ data });
      return;
    }

    try {
      await this.prisma.eventoAuditoria.create({ data });
    } catch (error) {
      console.error('[AuditoriaService] Falha ao registrar evento:', error);
    }
  }

  async findAll(params: ListarAuditoriaParams) {
    const {
      entidade,
      entidadeId,
      usuarioId,
      tipoEvento,
      dataInicio,
      dataFim,
      page = 1,
      pageSize = 20,
    } = params;

    const where: Prisma.EventoAuditoriaWhereInput = {
      entidade,
      entidadeId,
      usuarioId,
      tipoEvento,
      criadoEm: {
        gte: dataInicio,
        lte: dataFim,
      },
    };

    // remove chaves undefined para não filtrar indevidamente
    Object.keys(where).forEach((key) => {
      if (where[key as keyof typeof where] === undefined) {
        delete where[key as keyof typeof where];
      }
    });
    if (where.criadoEm && !dataInicio && !dataFim) {
      delete where.criadoEm;
    }

    const skip = (page - 1) * pageSize;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.eventoAuditoria.findMany({
        where,
        orderBy: { criadoEm: 'desc' },
        skip,
        take: pageSize,
        include: {
          usuario: { select: { id: true, nome: true, papel: true } },
        },
      }),
      this.prisma.eventoAuditoria.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

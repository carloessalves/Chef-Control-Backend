import { Injectable, Logger } from '@nestjs/common';
import { PapelUsuario, TipoEvento, Prisma, PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

interface RegistrarEventoParams {
  usuarioId?: string | null;
  papelNoMomento?: PapelUsuario | null;
  tipoEvento: TipoEvento;
  entidade: string;
  entidadeId?: string | null;
  dadosAntes?: Prisma.InputJsonValue | null;
  dadosDepois?: Prisma.InputJsonValue | null;
  dispositivoId?: string | null;
}

@Injectable()
export class AuditoriaService {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra um evento de auditoria.
   *
   * @param params Dados do evento.
   * @param tx Cliente transacional opcional (`tx` de `$transaction`).
   *   Quando informado, a auditoria é escrita na MESMA transação da
   *   operação de negócio (atômico: se um falhar, ambos revertem).
   *   Quando omitido, usa o client padrão e falhas de auditoria são
   *   apenas logadas, sem interromper o fluxo principal.
   */
  async registrar(
    params: RegistrarEventoParams,
    tx?: PrismaTransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;

    if (tx) {
      // Dentro de uma transação: deixa o erro propagar para
      // garantir atomicidade (rollback da operação de negócio).
      await client.eventoAuditoria.create({
        data: {
          usuarioId: params.usuarioId ?? null,
          papelNoMomento: params.papelNoMomento ?? null,
          tipoEvento: params.tipoEvento,
          entidade: params.entidade,
          entidadeId: params.entidadeId ?? null,
          dadosAntes: params.dadosAntes ?? undefined,
          dadosDepois: params.dadosDepois ?? undefined,
          dispositivoId: params.dispositivoId ?? null,
        },
      });
      return;
    }

    try {
      await client.eventoAuditoria.create({
        data: {
          usuarioId: params.usuarioId ?? null,
          papelNoMomento: params.papelNoMomento ?? null,
          tipoEvento: params.tipoEvento,
          entidade: params.entidade,
          entidadeId: params.entidadeId ?? null,
          dadosAntes: params.dadosAntes ?? undefined,
          dadosDepois: params.dadosDepois ?? undefined,
          dispositivoId: params.dispositivoId ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao registrar evento de auditoria (${params.tipoEvento} em ${params.entidade}:${params.entidadeId ?? '?'})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}

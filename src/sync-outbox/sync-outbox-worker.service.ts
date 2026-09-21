import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../prisma/prisma.service.js';
import { SyncOutboxStatus, SyncOutboxTipo } from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { isLocalMode } from '../config/server-mode.config.js';

const ENDPOINT_POR_TIPO: Record<SyncOutboxTipo, { method: 'POST' | 'PATCH'; path: (id: string) => string }> = {
  CRIAR_EMISSOR:      { method: 'POST',  path: () => '/emissores/sync' },
  ATUALIZAR_EMISSOR:  { method: 'PATCH', path: (id) => `/emissores/${id}/sync` },
  CRIAR_PRODUTO:      { method: 'POST',  path: () => '/produtos-manipulados/sync' },
  ATUALIZAR_PRODUTO:  { method: 'PATCH', path: (id) => `/produtos-manipulados/${id}/sync` },
  CRIAR_ETIQUETA:     { method: 'POST',  path: () => '/etiquetas/sync' },
  ATUALIZAR_ETIQUETA: { method: 'PATCH', path: (id) => `/etiquetas/${id}/sync` },
};

const LIMITE_TENTATIVAS = 5;
const LOTE_MAXIMO = 20;
// Backoff exponencial: 1min, 5min, 30min, 2h, 6h
const BACKOFF_MINUTOS = [1, 5, 30, 120, 360];

@Injectable()
export class SyncOutboxWorkerService {
  private readonly logger = new Logger(SyncOutboxWorkerService.name);
  private processando = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
  ) {}

  @Cron(CronExpression.EVERY_30_SECONDS)
  async cronProcessarFila() {
    if (!isLocalMode()) return; // worker só roda no servidor local
    await this.processarFila();
  }

  /** Trigger otimista — chamado pelos services após enfileirar(). Fire-and-forget. */
  dispararProcessamentoOtimista() {
    if (!isLocalMode()) return;
    if (this.processando) return;
    this.processarFila().catch((err) =>
      this.logger.error('Erro no processamento otimista da SyncOutbox', err),
    );
  }

  private async processarFila() {
    if (this.processando) return;
    this.processando = true;

    try {
      const agora = new Date();
      const pendentes = await this.prisma.syncOutbox.findMany({
        where: {
          status: SyncOutboxStatus.PENDENTE,
          OR: [{ proximaTentativaEm: null }, { proximaTentativaEm: { lte: agora } }],
        },
        orderBy: { criadoEm: 'asc' }, // preserva ordem de dependência entre entidades
        take: LOTE_MAXIMO,
      });

      for (const item of pendentes) {
        const sucesso = await this.enviarItem(item);
        if (!sucesso) break; // interrompe o lote para preservar ordem
      }
    } finally {
      this.processando = false;
    }
  }

  private async enviarItem(item: {
    id: string;
    tipo: SyncOutboxTipo;
    payload: any;
    tentativas: number;
  }): Promise<boolean> {
    const rota = ENDPOINT_POR_TIPO[item.tipo];
    const entidadeId = item.payload?.id;
    const url = `${process.env.CLOUD_API_URL}${rota.path(entidadeId)}`;

    try {
      await firstValueFrom(
        this.http.request({
          method: rota.method,
          url,
          data: item.payload,
          headers: { 'x-sync-api-key': process.env.SYNC_API_KEY },
          timeout: 10_000,
        }),
      );

      await this.prisma.syncOutbox.update({
        where: { id: item.id },
        data: { status: SyncOutboxStatus.ENVIADO, erro: null },
      });

      this.logger.log(`Sincronizado com sucesso: ${item.tipo} (${entidadeId})`);
      return true;
    } catch (err) {
      const tentativas = item.tentativas + 1;
      const mensagemErro = this.extrairMensagemErro(err);

      if (tentativas >= LIMITE_TENTATIVAS) {
        await this.prisma.syncOutbox.update({
          where: { id: item.id },
          data: { status: SyncOutboxStatus.ERRO_PERMANENTE, tentativas, erro: mensagemErro },
        });
        this.logger.error(
          `ERRO_PERMANENTE após ${tentativas} tentativas: ${item.tipo} (${entidadeId}) — ${mensagemErro}`,
        );
      } else {
        const minutos = BACKOFF_MINUTOS[tentativas - 1] ?? BACKOFF_MINUTOS[BACKOFF_MINUTOS.length - 1];
        const proximaTentativaEm = new Date(Date.now() + minutos * 60_000);

        await this.prisma.syncOutbox.update({
          where: { id: item.id },
          data: { tentativas, proximaTentativaEm, erro: mensagemErro },
        });
        this.logger.warn(
          `Falha na tentativa ${tentativas}/${LIMITE_TENTATIVAS} de ${item.tipo} (${entidadeId}). ` +
          `Próxima tentativa em ${minutos}min. Erro: ${mensagemErro}`,
        );
      }
      return false;
    }
  }

  private extrairMensagemErro(err: unknown): string {
    if (err instanceof AxiosError) {
      return `HTTP ${err.response?.status ?? '???'}: ${JSON.stringify(err.response?.data ?? err.message)}`;
    }
    return err instanceof Error ? err.message : String(err);
  }
}

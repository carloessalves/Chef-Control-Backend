// src/etiquetas/etiquetas.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, StatusEtiqueta, CondicaoArmazenamento } from '@prisma/client';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

@Injectable()
export class EtiquetasRepository {
  constructor(private readonly prisma: PrismaService) {}

  async executarEmTransacao<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  async encontrarProdutoAtivo(
    produtoId: string,
    unidadeId: string,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.produtoManipulado.findFirst({
      where: { id: produtoId, unidadeId, ativo: true },
    });
  }

  async encontrarEmissorAtivo(
    emissorId: string,
    unidadeId: string,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.emissor.findFirst({
      where: { id: emissorId, unidadeId, ativo: true },
    });
  }

  async encontrarRegraValidade(
    condicao: CondicaoArmazenamento,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.regraValidade.findUnique({ where: { condicao } });
  }

  async criar(
    data: Prisma.EtiquetaCreateInput,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.etiqueta.create({ data });
  }

  async atualizar(
    id: string,
    data: Prisma.EtiquetaUpdateInput,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.etiqueta.update({ where: { id }, data });
  }

  async encontrarPorIdEUnidade(
    id: string,
    unidadeId: string,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.etiqueta.findFirst({ where: { id, unidadeId } });
  }

  async listar(
    where: Prisma.EtiquetaWhereInput,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.etiqueta.findMany({
      where,
      include: { produto: true, emissor: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async marcarVencidas(client: PrismaClientOrTx = this.prisma) {
    return client.etiqueta.updateMany({
      where: {
        status: StatusEtiqueta.VALIDA,
        dataValidade: { lt: new Date() },
      },
      data: { status: StatusEtiqueta.VENCIDA },
    });
  }

  async criarHistoricoReimpressao(
    data: { etiquetaId: string; motivo: string; dispositivoId: string },
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.historicoReimpressao.create({ data });
  }

  async listarHistoricoReimpressoes(
    etiquetaId: string,
    client: PrismaClientOrTx = this.prisma,
  ) {
    return client.historicoReimpressao.findMany({
      where: { etiquetaId },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async encontrarPublicaPorId(id: string, client: PrismaClientOrTx = this.prisma) {
    return client.etiqueta.findUnique({
      where: { id },
      include: { produto: true, emissor: true },
    });
  }

  /**
   * 🆕 Upsert usado exclusivamente pelo endpoint /sync (chamado pelo Sync Worker
   * do servidor local). Idempotente por id — protege contra reenvio em caso de
   * timeout de rede sem gerar erro de PK duplicada.
   * Ignora campos extras que não pertencem ao model (payload vem do outbox).
   */
  async upsertParaSync(payload: any, client: PrismaClientOrTx = this.prisma) {
    return client.etiqueta.upsert({
      where: { id: payload.id },
      create: {
        id: payload.id,
        produtoId: payload.produtoId,
        emissorId: payload.emissorId,
        unidadeId: payload.unidadeId,
        dispositivoId: payload.dispositivoId,
        emissorUsuarioId: payload.emissorUsuarioId ?? null,
        condicao: payload.condicao,
        lote: payload.lote ?? null,
        dataManipulacao: payload.dataManipulacao,
        dataValidade: payload.dataValidade,
        status: payload.status,
        motivoReimpressao: payload.motivoReimpressao ?? null,
        motivoDescarte: payload.motivoDescarte ?? null,
      } as Prisma.EtiquetaUncheckedCreateInput,
      update: {
        status: payload.status,
        motivoReimpressao: payload.motivoReimpressao ?? null,
        motivoDescarte: payload.motivoDescarte ?? null,
      },
    });
  }
}

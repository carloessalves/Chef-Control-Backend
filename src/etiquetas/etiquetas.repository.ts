// src/etiquetas/etiquetas.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma, StatusEtiqueta, CondicaoArmazenamento } from '@prisma/client';

type PrismaClientOrTx = PrismaService | Prisma.TransactionClient;

@Injectable()
export class EtiquetasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Permite executar operações dentro de uma transação Prisma */
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

  // ---------- Histórico de Reimpressões ----------

  async criarHistoricoReimpressao(
    data: {
      etiquetaId: string;
      motivo: string;
      dispositivoId: string;
    },
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

  // ---------- Consulta pública ----------

  /**
   * Busca por id puro, SEM filtro de unidadeId — intencional, pois quem
   * escaneia o QR não tem essa informação. Seguro porque exige o UUID
   * exato (não enumerável em tempo razoável) e o service filtra os
   * campos retornados para não expor dados sensíveis.
   */
  async encontrarPublicaPorId(id: string, client: PrismaClientOrTx = this.prisma) {
    return client.etiqueta.findUnique({
      where: { id },
      include: { produto: true, emissor: true },
    });
  }
}

// src/etiquetas/etiquetas.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { EtiquetasRepository } from './etiquetas.repository.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { SyncOutboxService } from '../sync-outbox/sync-outbox.service.js'; // 🆕
import { CriarEtiquetaDto } from './dto/criar-etiqueta.dto.js';
import { ReimprimirEtiquetaDto } from './dto/reimprimir-etiqueta.dto.js';
import { AtualizarStatusEtiquetaDto } from './dto/atualizar-status-etiqueta.dto.js';
import { ListarEtiquetasDto } from './dto/listar-etiquetas.dto.js';
import { AuthenticatedDevice } from '../auth/decorators/current-device.decorator.js';
import { StatusEtiqueta, TipoEvento, Prisma, SyncOutboxTipo } from '@prisma/client'; // 🆕 SyncOutboxTipo

@Injectable()
export class EtiquetasService {
  constructor(
    private readonly etiquetasRepo: EtiquetasRepository,
    private readonly auditoria: AuditoriaService,
    private readonly syncOutbox: SyncOutboxService, // 🆕
  ) {}

  async criar(dto: CriarEtiquetaDto, dispositivo: AuthenticatedDevice) {
    const produto = await this.validarProdutoAtivo(dto.produtoId, dispositivo.unidadeId);
    const emissor = await this.validarEmissorAtivo(dto.emissorId, dispositivo.unidadeId);
    const regra = await this.validarRegraValidade(dto.condicao);

    const dataManipulacao = dto.dataManipulacao ? new Date(dto.dataManipulacao) : new Date();
    const dataValidade = new Date(
      dataManipulacao.getTime() + regra.horasValidade * 60 * 60 * 1000,
    );

    try {
      return await this.etiquetasRepo.executarEmTransacao(async (tx) => {
        const etiqueta = await this.etiquetasRepo.criar(
          {
            ...(dto.id ? { id: dto.id } : {}),
            produto: { connect: { id: dto.produtoId } },
            emissor: { connect: { id: dto.emissorId } },
            unidade: { connect: { id: dispositivo.unidadeId } },
            dispositivo: { connect: { id: dispositivo.id } },
            condicao: dto.condicao,
            lote: dto.lote,
            dataManipulacao,
            dataValidade,
            status: StatusEtiqueta.VALIDA,
          },
          tx,
        );

        await this.auditoria.registrar(
          {
            tipoEvento: TipoEvento.EMIT,
            entidade: 'Etiqueta',
            entidadeId: etiqueta.id,
            dadosDepois: etiqueta,
            dispositivoId: dispositivo.id,
          },
          tx,
        );

        // 🆕 Enfileira para sincronização com o cloud (no-op se SERVER_MODE=cloud)
        await this.syncOutbox.enfileirar(
          SyncOutboxTipo.CRIAR_ETIQUETA,
          etiqueta,
          tx,
        );

        return etiqueta;
      });
    } catch (e) {
      // Idempotência: se a fila de sync reenviar um id já criado
      // (ex.: resposta original se perdeu por timeout de rede),
      // devolve a etiqueta existente em vez de estourar erro 500.
      if (dto.id && this.isConstraintViolation(e)) {
        const existente = await this.etiquetasRepo.encontrarPorIdEUnidade(
          dto.id,
          dispositivo.unidadeId,
        );
        if (existente) return existente;
      }
      throw e;
    }
  }

  private isConstraintViolation(e: unknown): boolean {
    return (
      typeof e === 'object' &&
      e !== null &&
      (e as { code?: string }).code === 'P2002'
    );
  }

  // ---------- Helpers de validação ----------

  private async validarProdutoAtivo(produtoId: string, unidadeId: string) {
    const produto = await this.etiquetasRepo.encontrarProdutoAtivo(produtoId, unidadeId);
    if (!produto) {
      throw new NotFoundException('Produto não encontrado ou inativo nesta unidade.');
    }
    return produto;
  }

  private async validarEmissorAtivo(emissorId: string, unidadeId: string) {
    const emissor = await this.etiquetasRepo.encontrarEmissorAtivo(emissorId, unidadeId);
    if (!emissor) {
      throw new NotFoundException('Emissor não encontrado ou inativo nesta unidade.');
    }
    return emissor;
  }

  private async validarRegraValidade(condicao: CriarEtiquetaDto['condicao']) {
    const regra = await this.etiquetasRepo.encontrarRegraValidade(condicao);
    if (!regra) {
      throw new BadRequestException(
        `Não existe regra de validade cadastrada para a condição ${condicao}.`,
      );
    }
    return regra;
  }

  // ---------- Reimpressão ----------

  async reimprimir(
    id: string,
    dto: ReimprimirEtiquetaDto,
    dispositivo: AuthenticatedDevice,
  ) {
    const etiqueta = await this.buscarOuFalhar(id, dispositivo.unidadeId);

    if (etiqueta.status !== StatusEtiqueta.VALIDA) {
      throw new BadRequestException(
        'Só é possível reimprimir etiquetas com status VALIDA.',
      );
    }

    return this.etiquetasRepo.executarEmTransacao(async (tx) => {
      const historico = await this.etiquetasRepo.criarHistoricoReimpressao(
        {
          etiquetaId: id,
          motivo: dto.motivoReimpressao,
          dispositivoId: dispositivo.id,
        },
        tx,
      );

      const etiquetaAtualizada = await this.etiquetasRepo.atualizar(
        id,
        { motivoReimpressao: dto.motivoReimpressao },
        tx,
      );

      await this.auditoria.registrar(
        {
          tipoEvento: TipoEvento.REPRINT,
          entidade: 'Etiqueta',
          entidadeId: id,
          dadosAntes: etiqueta,
          dadosDepois: etiquetaAtualizada,
          dispositivoId: dispositivo.id,
        },
        tx,
      );

      // 🆕 Enfileira atualização para sincronização com o cloud
      await this.syncOutbox.enfileirar(
        SyncOutboxTipo.ATUALIZAR_ETIQUETA,
        etiquetaAtualizada,
        tx,
      );

      return { etiqueta: etiquetaAtualizada, historico };
    });
  }

  async listarHistoricoReimpressoes(id: string, unidadeId: string) {
    await this.buscarOuFalhar(id, unidadeId);
    return this.etiquetasRepo.listarHistoricoReimpressoes(id);
  }

  // ---------- Atualização de status ----------

  async atualizarStatus(
    id: string,
    dto: AtualizarStatusEtiquetaDto,
    dispositivo: AuthenticatedDevice,
  ) {
    const etiqueta = await this.buscarOuFalhar(id, dispositivo.unidadeId);

    if (etiqueta.status !== StatusEtiqueta.VALIDA) {
      throw new BadRequestException(
        'Só é possível alterar o status de etiquetas com status VALIDA.',
      );
    }

    return this.etiquetasRepo.executarEmTransacao(async (tx) => {
      const dataAtualizacao: Prisma.EtiquetaUpdateInput = {
        status: dto.status,
      };

      if (dto.status === StatusEtiqueta.DESCARTADA) {
        dataAtualizacao.motivoDescarte = dto.motivoDescarte;
      }

      const etiquetaAtualizada = await this.etiquetasRepo.atualizar(id, dataAtualizacao, tx);

      await this.auditoria.registrar(
        {
          tipoEvento: TipoEvento.UPDATE,
          entidade: 'Etiqueta',
          entidadeId: id,
          dadosAntes: etiqueta,
          dadosDepois: etiquetaAtualizada,
          dispositivoId: dispositivo.id,
        },
        tx,
      );

      // 🆕 Enfileira atualização para sincronização com o cloud
      // (cobre DESCARTADA, CONSUMIDA e qualquer outra transição de status)
      await this.syncOutbox.enfileirar(
        SyncOutboxTipo.ATUALIZAR_ETIQUETA,
        etiquetaAtualizada,
        tx,
      );

      return etiquetaAtualizada;
    });
  }

  // ---------- Listagem e busca ----------

  async listar(unidadeId: string, filtros: ListarEtiquetasDto) {
    const where: Prisma.EtiquetaWhereInput = { unidadeId };

    if (filtros.status) where.status = filtros.status;
    if (filtros.produtoId) where.produtoId = filtros.produtoId;
    if (filtros.emissorId) where.emissorId = filtros.emissorId;
    if (filtros.dataInicio || filtros.dataFim) {
      where.dataManipulacao = {
        ...(filtros.dataInicio ? { gte: new Date(filtros.dataInicio) } : {}),
        ...(filtros.dataFim ? { lte: new Date(filtros.dataFim) } : {}),
      };
    }

    return this.etiquetasRepo.listar(where);
  }

  async buscarPorId(id: string, unidadeId: string) {
    return this.buscarOuFalhar(id, unidadeId);
  }

  private async buscarOuFalhar(id: string, unidadeId: string) {
    const etiqueta = await this.etiquetasRepo.encontrarPorIdEUnidade(id, unidadeId);
    if (!etiqueta) {
      throw new NotFoundException('Etiqueta não encontrada.');
    }
    return etiqueta;
  }

  async marcarVencidas(): Promise<number> {
    const resultado = await this.etiquetasRepo.marcarVencidas();
    return resultado.count;
  }

  // ---------- Consulta pública (via QR) ----------

  /**
   * Consulta pública — sem autenticação, acessada ao escanear o QR físico.
   * Retorna apenas dados seguros para exibição, nunca informações internas
   * (dispositivoId, emissorId, unidadeId, motivos de reimpressão/descarte, etc.).
   */
  async consultaPublica(id: string) {
    const etiqueta = await this.etiquetasRepo.encontrarPublicaPorId(id);
    if (!etiqueta) {
      throw new NotFoundException('Etiqueta não encontrada.');
    }

    return {
      produto: etiqueta.produto.nome,
      alergenos: etiqueta.produto.alergenos,
      condicao: etiqueta.condicao,
      lote: etiqueta.lote,
      dataManipulacao: etiqueta.dataManipulacao,
      dataValidade: etiqueta.dataValidade,
      status: etiqueta.status,
      responsavel: etiqueta.emissor.nome,
    };
  }
}

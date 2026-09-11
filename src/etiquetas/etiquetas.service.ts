import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditoriaService } from '../auditoria/auditoria.service.js';
import { CriarEtiquetaDto } from './dto/criar-etiqueta.dto.js';
import { ReimprimirEtiquetaDto } from './dto/reimprimir-etiqueta.dto.js';
import { AtualizarStatusEtiquetaDto } from './dto/atualizar-status-etiqueta.dto.js';
import { ListarEtiquetasDto } from './dto/listar-etiquetas.dto.js';
import { AuthenticatedDevice } from '../auth/decorators/current-device.decorator.js';
import { StatusEtiqueta, TipoEvento, Prisma } from '@prisma/client';

@Injectable()
export class EtiquetasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async criar(dto: CriarEtiquetaDto, dispositivo: AuthenticatedDevice) {
    const produto = await this.prisma.produtoManipulado.findFirst({
      where: { id: dto.produtoId, unidadeId: dispositivo.unidadeId, ativo: true },
    });
    if (!produto) {
      throw new NotFoundException('Produto não encontrado ou inativo nesta unidade.');
    }

    const emissor = await this.prisma.emissor.findFirst({
      where: { id: dto.emissorId, unidadeId: dispositivo.unidadeId, ativo: true },
    });
    if (!emissor) {
      throw new NotFoundException('Emissor não encontrado ou inativo nesta unidade.');
    }

    const regra = await this.prisma.regraValidade.findUnique({
      where: { condicao: dto.condicao },
    });
    if (!regra) {
      throw new BadRequestException(
        `Não existe regra de validade cadastrada para a condição ${dto.condicao}.`,
      );
    }

    const dataManipulacao = dto.dataManipulacao ? new Date(dto.dataManipulacao) : new Date();
    const dataValidade = new Date(
      dataManipulacao.getTime() + regra.horasValidade * 60 * 60 * 1000,
    );

    // Criação da etiqueta + registro de auditoria são atômicos:
    // se a auditoria falhar, a etiqueta também não é criada.
    return this.prisma.$transaction(async (tx) => {
      const etiqueta = await tx.etiqueta.create({
        data: {
          produtoId: dto.produtoId,
          emissorId: dto.emissorId,
          unidadeId: dispositivo.unidadeId,
          dispositivoId: dispositivo.id,
          condicao: dto.condicao,
          lote: dto.lote,
          dataManipulacao,
          dataValidade,
          status: StatusEtiqueta.VALIDA,
        },
      });

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

      return etiqueta;
    });
  }

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

    return this.prisma.$transaction(async (tx) => {
      const etiquetaAtualizada = await tx.etiqueta.update({
        where: { id },
        data: { motivoReimpressao: dto.motivoReimpressao },
      });

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

      return etiquetaAtualizada;
    });
  }

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

    return this.prisma.$transaction(async (tx) => {
      const dataAtualizacao: Prisma.EtiquetaUpdateInput = {
        status: dto.status,
      };

      if (dto.status === StatusEtiqueta.DESCARTADA) {
        dataAtualizacao.motivoDescarte = dto.motivoDescarte;
      }

      const etiquetaAtualizada = await tx.etiqueta.update({
        where: { id },
        data: dataAtualizacao,
      });

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

      return etiquetaAtualizada;
    });
  }

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

    return this.prisma.etiqueta.findMany({
      where,
      include: { produto: true, emissor: true },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async buscarPorId(id: string, unidadeId: string) {
    return this.buscarOuFalhar(id, unidadeId);
  }

  private async buscarOuFalhar(id: string, unidadeId: string) {
    const etiqueta = await this.prisma.etiqueta.findFirst({
      where: { id, unidadeId },
    });
    if (!etiqueta) {
      throw new NotFoundException('Etiqueta não encontrada.');
    }
    return etiqueta;
  }

  async marcarVencidas(): Promise<number> {
    const resultado = await this.prisma.etiqueta.updateMany({
      where: {
        status: StatusEtiqueta.VALIDA,
        dataValidade: { lt: new Date() },
      },
      data: { status: StatusEtiqueta.VENCIDA },
    });
    return resultado.count;
  }
}

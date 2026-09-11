import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { TipoEvento } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';

@Injectable()
export class DispositivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
  ) {}

  async vincular(dto: VincularDispositivoDto, user: AuthenticatedUser) {
    const existente = await this.prisma.dispositivo.findUnique({
      where: { identificador: dto.identificador },
    });

    if (existente) {
      if (existente.unidadeId !== user.unidadeId) {
        throw new ConflictException(
          'Este dispositivo já está vinculado a outra unidade.',
        );
      }

      // Renovação: reativa se estava desativado (soft delete) e atualiza dados
      return this.prisma.$transaction(async (tx) => {
        const renovado = await tx.dispositivo.update({
          where: { id: existente.id },
          data: {
            nome: dto.nome ?? existente.nome,
            ativo: true,
            ultimoAcesso: new Date(),
          },
        });

        await this.auditoria.registrar(
          {
            usuarioId: user.sub,
            papelNoMomento: user.papel,
            tipoEvento: TipoEvento.UPDATE,
            entidade: 'Dispositivo',
            entidadeId: renovado.id,
            dadosAntes: existente,
            dadosDepois: renovado,
          },
          tx,
        );

        return renovado;
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const criado = await tx.dispositivo.create({
        data: {
          identificador: dto.identificador,
          nome: dto.nome,
          unidadeId: user.unidadeId,
          ativo: true,
          ultimoAcesso: new Date(),
        },
      });

      await this.auditoria.registrar(
        {
          usuarioId: user.sub,
          papelNoMomento: user.papel,
          tipoEvento: TipoEvento.CREATE,
          entidade: 'Dispositivo',
          entidadeId: criado.id,
          dadosDepois: criado,
        },
        tx,
      );

      return criado;
    });
  }

  async findAll(user: AuthenticatedUser) {
    return this.prisma.dispositivo.findMany({
      where: { unidadeId: user.unidadeId, ativo: true },
      orderBy: { ultimoAcesso: 'desc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const dispositivo = await this.prisma.dispositivo.findFirst({
      where: { id, unidadeId: user.unidadeId, ativo: true },
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
    // Reaproveita findOne para garantir escopo por unidade + ativo=true + 404 padronizado
    const antes = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const atualizado = await tx.dispositivo.update({
        where: { id },
        data: { nome: dto.nome },
      });

      await this.auditoria.registrar(
        {
          usuarioId: user.sub,
          papelNoMomento: user.papel,
          tipoEvento: TipoEvento.UPDATE,
          entidade: 'Dispositivo',
          entidadeId: atualizado.id,
          dadosAntes: antes,
          dadosDepois: atualizado,
        },
        tx,
      );

      return atualizado;
    });
  }

  /**
   * Soft delete: desativa o dispositivo em vez de removê-lo.
   * Preserva histórico/auditoria de etiquetas emitidas por ele
   * e evita violação de FK (Etiqueta.dispositivoId é obrigatório).
   */
  async remove(id: string, user: AuthenticatedUser) {
    const antes = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const desativado = await tx.dispositivo.update({
        where: { id },
        data: { ativo: false },
      });

      await this.auditoria.registrar(
        {
          usuarioId: user.sub,
          papelNoMomento: user.papel,
          tipoEvento: TipoEvento.DELETE,
          entidade: 'Dispositivo',
          entidadeId: desativado.id,
          dadosAntes: antes,
          dadosDepois: desativado,
        },
        tx,
      );

      return desativado;
    });
  }
}

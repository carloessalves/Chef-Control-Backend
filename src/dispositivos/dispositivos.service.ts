import {
  Injectable,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TipoEvento, PapelUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { VincularComLoginDto } from './dto/vincular-com-login.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';

@Injectable()
export class DispositivosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditoria: AuditoriaService,
    private readonly authService: AuthService,
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

      if (dto.nome && dto.nome !== existente.nome) {
        await this.verificarNomeDuplicado(
          dto.nome,
          user.unidadeId,
          existente.id,
        );
      }

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

    if (dto.nome) {
      await this.verificarNomeDuplicado(dto.nome, user.unidadeId);
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

  /**
   * Bootstrap do primeiro uso: o ADMIN digita nome + PIN diretamente na tela
   * de cadastro do dispositivo (sem device vinculado ainda e sem JWT prévio).
   * Valida as credenciais, vincula o dispositivo à unidade do usuário e já
   * retorna o token de acesso, evitando um segundo passo de login.
   */
  async vincularComLogin(dto: VincularComLoginDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { nome: dto.nomeUsuario },
    });

    const credenciaisInvalidas = () =>
      new UnauthorizedException('Nome de usuário ou PIN inválidos.');

    if (!usuario || !usuario.ativo) {
      throw credenciaisInvalidas();
    }

    if (usuario.papel !== PapelUsuario.ADMIN) {
      throw new UnauthorizedException(
        'Apenas usuários ADMIN podem cadastrar dispositivos.',
      );
    }

    const pinValido = await bcrypt.compare(dto.pin, usuario.pin);
    if (!pinValido) {
      throw credenciaisInvalidas();
    }

    const authUser: AuthenticatedUser = {
      sub: usuario.id,
      papel: usuario.papel,
      unidadeId: usuario.unidadeId,
      nome: usuario.nome,
    };

    const dispositivo = await this.vincular(
      {
        identificador: dto.identificador,
        nome: dto.nomeDispositivo,
      },
      authUser,
    );

    const { accessToken, usuario: usuarioResumo } =
      this.authService.emitirToken(usuario);

    return {
      accessToken,
      usuario: usuarioResumo,
      dispositivo,
    };
  }

  async findAll(user: AuthenticatedUser, incluirInativos = false) {
    return this.prisma.dispositivo.findMany({
      where: {
        unidadeId: user.unidadeId,
        ...(!incluirInativos && { ativo: true }),
      },
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

  /**
   * Igual ao findOne, mas não filtra por `ativo` — usado internamente
   * pelo fluxo de reativação, que precisa localizar dispositivos inativos.
   */
  private async findOneIncluindoInativos(id: string, user: AuthenticatedUser) {
    const dispositivo = await this.prisma.dispositivo.findFirst({
      where: { id, unidadeId: user.unidadeId },
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
    const antes = await this.findOne(id, user);

    if (dto.nome !== antes.nome) {
      await this.verificarNomeDuplicado(dto.nome, user.unidadeId, id);
    }

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

  /**
   * Reativação manual pelo ADMIN (sem exigir que o próprio dispositivo
   * chame /vincular novamente). Só faz sentido se o dispositivo já estiver
   * inativo — se já estiver ativo, é um no-op idempotente.
   */
  async reativar(id: string, user: AuthenticatedUser) {
    const antes = await this.findOneIncluindoInativos(id, user);

    if (antes.ativo) {
      return antes;
    }

    if (antes.nome) {
      await this.verificarNomeDuplicado(antes.nome, user.unidadeId, id);
    }

    return this.prisma.$transaction(async (tx) => {
      const reativado = await tx.dispositivo.update({
        where: { id },
        data: { ativo: true },
      });

      await this.auditoria.registrar(
        {
          usuarioId: user.sub,
          papelNoMomento: user.papel,
          tipoEvento: TipoEvento.UPDATE,
          entidade: 'Dispositivo',
          entidadeId: reativado.id,
          dadosAntes: antes,
          dadosDepois: reativado,
        },
        tx,
      );

      return reativado;
    });
  }

  private async verificarNomeDuplicado(
    nome: string,
    unidadeId: string,
    ignorarId?: string,
  ) {
    const duplicado = await this.prisma.dispositivo.findFirst({
      where: {
        nome,
        unidadeId,
        ativo: true,
        ...(ignorarId && { id: { not: ignorarId } }),
      },
    });

    if (duplicado) {
      throw new ConflictException(
        `Já existe um dispositivo ativo chamado "${nome}" nesta unidade.`,
      );
    }
  }
}

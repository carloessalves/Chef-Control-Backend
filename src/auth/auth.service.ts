import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { TipoEvento, PapelUsuario, EntidadeAuditoria } from '@prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  static async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, SALT_ROUNDS);
  }

  static async verificarPin(pin: string, hash: string): Promise<boolean> {
    return bcrypt.compare(pin, hash);
  }

  async listarUsuariosDaUnidade(unidadeId: string) {
    return this.prisma.usuario.findMany({
      where: { unidadeId, ativo: true },
      select: { id: true, nome: true, funcao: true, papel: true },
      orderBy: { nome: 'asc' },
    });
  }

  async login(
  dto: LoginDto,
  unidadeId: string | undefined,
  dispositivoId: string | undefined,
) {
  const usuario = await this.prisma.usuario.findFirst({
    where: {
      nome: dto.nomeUsuario,
      ...(unidadeId ? { unidadeId } : {}),
    },
  });

  if (!usuario || !usuario.ativo) {
    await this.registrarTentativaLogin({
      usuarioId: usuario?.id ?? null,
      papel: usuario?.papel ?? null,
      dispositivoId,
      sucesso: false,
      motivo: 'Usuário inválido ou inativo',
    });
    throw new UnauthorizedException('Usuário inválido ou inativo.');
  }

  const pinValido = await bcrypt.compare(dto.pin, usuario.pin);
  if (!pinValido) {
    await this.registrarTentativaLogin({
      usuarioId: usuario.id,
      papel: usuario.papel,
      dispositivoId,
      sucesso: false,
      motivo: 'PIN inválido',
    });
    throw new UnauthorizedException('PIN inválido.');
  }

  await this.registrarTentativaLogin({
    usuarioId: usuario.id,
    papel: usuario.papel,
    dispositivoId,
    sucesso: true,
  });

  return this.gerarToken(usuario);
}


  // Usado pelo DispositivosService no fluxo de "vincular com login",
  // que também precisa emitir um token ao final da operação.
  emitirToken(usuario: {
    id: string;
    papel: PapelUsuario;
    unidadeId: string;
    nome: string;
  }) {
    return this.gerarToken(usuario);
  }

  private async registrarTentativaLogin(params: {
    usuarioId: string | null;
    papel: PapelUsuario | null;
    dispositivoId?: string;
    sucesso: boolean;
    motivo?: string;
  }) {
    const { usuarioId, papel, dispositivoId, sucesso, motivo } = params;

    try {
      await this.prisma.eventoAuditoria.create({
        data: {
          usuarioId: usuarioId ?? undefined,
          papelNoMomento: papel ?? undefined,
          tipoEvento: TipoEvento.LOGIN,
          entidade: EntidadeAuditoria.Usuario,
          entidadeId: usuarioId ?? undefined,
          dadosDepois: { sucesso, motivo: motivo ?? null },
          dispositivoId: dispositivoId ?? undefined,
        },
      });
    } catch (error) {
      this.logger.error(
        `Falha ao registrar auditoria de tentativa de login (usuarioId: ${usuarioId ?? 'desconhecido'}).`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private gerarToken(usuario: {
    id: string;
    papel: string;
    unidadeId: string;
    nome: string;
  }) {
    const payload = {
      sub: usuario.id,
      papel: usuario.papel,
      unidadeId: usuario.unidadeId,
      nome: usuario.nome,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        papel: usuario.papel,
        unidadeId: usuario.unidadeId,
      },
    };
  }
}

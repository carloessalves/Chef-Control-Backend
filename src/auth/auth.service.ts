import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  static async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, SALT_ROUNDS);
  }

  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { unidadeId: dto.unidadeId },
    });

    // Busca todos os usuários da unidade e compara o PIN com bcrypt
    // (não dá para buscar direto pelo PIN pois ele está hasheado)
    const usuariosDaUnidade = await this.prisma.usuario.findMany({
      where: { unidadeId: dto.unidadeId, ativo: true },
    });

    let usuarioAutenticado = null;
    for (const u of usuariosDaUnidade) {
      const pinValido = await bcrypt.compare(dto.pin, u.pin);
      if (pinValido) {
        usuarioAutenticado = u;
        break;
      }
    }

    if (!usuarioAutenticado) {
      throw new UnauthorizedException('PIN ou unidade inválidos.');
    }

    return this.gerarTokens(usuarioAutenticado);
  }

  async refresh(refreshToken: string) {
    let payload: any;

    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
    });

    if (!usuario || !usuario.ativo) {
      throw new ForbiddenException('Usuário inválido ou inativo.');
    }

    return this.gerarTokens(usuario);
  }

  private gerarTokens(usuario: {
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

    const accessToken = this.jwtService.sign(payload, {
     secret: process.env.JWT_SECRET,
     expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '30m') as any,
    });

    const refreshToken = this.jwtService.sign(payload, {
     secret: process.env.JWT_REFRESH_SECRET,
     expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as any,
    });

  return {
    accessToken,
    refreshToken,
    usuario: {
      id: usuario.id,
      nome: usuario.nome,
      papel: usuario.papel,
      unidadeId: usuario.unidadeId,
    },
  };
}
}

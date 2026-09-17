import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedUser } from '../decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET não definido no .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Revalida o usuário contra o banco a cada requisição autenticada.
  // Evita que um token antigo continue válido por até 2h após o usuário
  // ser desativado ou ter papel/unidade alterados por um ADMIN.
  async validate(payload: AuthenticatedUser): Promise<AuthenticatedUser> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        nome: true,
        papel: true,
        unidadeId: true,
        ativo: true,
      },
    });

    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Usuário inválido ou inativo.');
    }

    // Se papel ou unidade foram alterados após a emissão do token,
    // invalida a sessão — o usuário precisa logar novamente para
    // receber um token atualizado.
    if (usuario.papel !== payload.papel || usuario.unidadeId !== payload.unidadeId) {
      throw new UnauthorizedException(
        'Sessão expirada devido a alteração de permissões. Faça login novamente.',
      );
    }

    return {
      sub: usuario.id,
      papel: usuario.papel,
      unidadeId: usuario.unidadeId,
      nome: usuario.nome,
    };
  }
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';

export interface AuthenticatedUser {
  sub: string;       // id do usuário
  papel: PapelUsuario;
  unidadeId: string;
  nome: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);

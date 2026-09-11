import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface AuthenticatedDevice {
  id: string;
  identificador: string;
  unidadeId: string;
}

export const CurrentDevice = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedDevice => {
    const request = ctx.switchToHttp().getRequest();
    return request.dispositivo;
  },
);

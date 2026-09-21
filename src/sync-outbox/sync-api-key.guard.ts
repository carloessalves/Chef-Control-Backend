import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';

@Injectable()
export class SyncApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const chaveRecebida = request.headers['x-sync-api-key'];
    const chaveEsperada = process.env.SYNC_API_KEY;

    if (!chaveEsperada) {
      throw new UnauthorizedException('SYNC_API_KEY não configurada no servidor.');
    }
    if (chaveRecebida !== chaveEsperada) {
      throw new UnauthorizedException('Chave de sincronização inválida.');
    }
    return true;
  }
}

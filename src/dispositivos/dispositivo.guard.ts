import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { IS_DEVICE_OPTIONAL_KEY } from './optional-device.decorator';

@Injectable()
export class DispositivoGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const isOptional = this.reflector.getAllAndOverride<boolean>(
      IS_DEVICE_OPTIONAL_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Lê o identificador do dispositivo enviado pelo app/tablet
    const identificador = request.headers['x-device-id'];

    if (!identificador || typeof identificador !== 'string') {
      if (isOptional) {
        // Rota permite acesso sem dispositivo vinculado (ex: login administrativo)
        return true;
      }
      throw new UnauthorizedException(
        'Cabeçalho "x-device-id" ausente. Dispositivo não identificado.',
      );
    }

    // Busca o dispositivo vinculado, incluindo a unidade fixa dele
    const dispositivo = await this.prisma.dispositivo.findUnique({
      where: { identificador },
      include: { unidade: true },
    });

    if (!dispositivo) {
      if (isOptional) {
        return true;
      }
      throw new UnauthorizedException(
        'Dispositivo não vinculado. Solicite o vínculo antes de usar este módulo.',
      );
    }

    if (!dispositivo.ativo) {
      throw new UnauthorizedException('Dispositivo desativado.');
    }

    if (!dispositivo.unidade?.ativo) {
      throw new UnauthorizedException(
        'Unidade vinculada a este dispositivo está inativa.',
      );
    }

    // Atualiza o último acesso de forma assíncrona, sem bloquear a request
    // (fire-and-forget: se falhar, não impede o uso do dispositivo)
    this.prisma.dispositivo
      .update({
        where: { id: dispositivo.id },
        data: { ultimoAcesso: new Date() },
      })
      .catch(() => {});

    // Disponibiliza o dispositivo (com unidade) para os controllers/services
    request.dispositivo = dispositivo;

    return true;
  }
}

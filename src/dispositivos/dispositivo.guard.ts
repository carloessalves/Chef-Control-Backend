import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DispositivoGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Lê o identificador do dispositivo enviado pelo app/tablet
    const identificador = request.headers['x-device-id'];

    if (!identificador || typeof identificador !== 'string') {
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

    // Disponibiliza o dispositivo (com unidade) para os controllers/services
    request.dispositivo = dispositivo;

    return true;
  }
}

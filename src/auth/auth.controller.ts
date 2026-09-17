import { Controller, Get, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Public } from './decorators/public.decorator';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard';
import { OptionalDevice } from '../dispositivos/optional-device.decorator';
import { RequestWithDispositivo } from '../dispositivos/request-with-dispositivo';
import { CurrentDevice, AuthenticatedDevice } from './decorators/current-device.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(DispositivoGuard)
  @Get('usuarios')
  listarUsuarios(@Req() req: RequestWithDispositivo) {
    return this.authService.listarUsuariosDaUnidade(req.dispositivo.unidadeId);
  }

  // Limite específico: 5 tentativas por minuto por IP, para mitigar brute-force de PIN
  @Public()
  @UseGuards(DispositivoGuard)
  @OptionalDevice()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(
    @Body() dto: LoginDto,
    @Req() req: RequestWithDispositivo,
    @CurrentDevice() dispositivo: AuthenticatedDevice | undefined,
  ) {
    return this.authService.login(dto, req.dispositivo?.unidadeId, dispositivo?.id);
  }
}

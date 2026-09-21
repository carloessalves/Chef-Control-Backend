import { Controller, Get, Patch, Param, Body, UseGuards, ParseEnumPipe } from '@nestjs/common';
import { CondicaoArmazenamento, PapelUsuario } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard';
import { RegrasValidadeService } from './regras-validade.service';
import { UpdateRegraValidadeDto } from './dto/update-regra-validade.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('regras-validade')
export class RegrasValidadeController {
  constructor(private readonly service: RegrasValidadeService) {}

  @Get()
  @Roles(PapelUsuario.ADMIN, PapelUsuario.AUDITOR)
  listar() {
    return this.service.listar();
  }

  // 🆕 Rota consumida pelo tablet (sem login de usuário) para cachear
  // localmente as horas de validade por condição e permitir cálculo
  // offline no momento da impressão. Autenticada por dispositivo,
  // mesmo padrão do EtiquetasController.
  @Public()
  @UseGuards(DispositivoGuard)
  @Get('dispositivo')
  listarParaDispositivo() {
    return this.service.listar();
  }

  @Patch(':condicao')
  @Roles(PapelUsuario.ADMIN)
  atualizar(
    @Param('condicao', new ParseEnumPipe(CondicaoArmazenamento))
    condicao: CondicaoArmazenamento,
    @Body() dto: UpdateRegraValidadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.atualizar(condicao, dto.horasValidade, user.sub, user.papel);
  }
}

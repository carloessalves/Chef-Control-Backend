import {Controller, Get, Patch, Param, Body, UseGuards, ParseEnumPipe} from '@nestjs/common';
import { CondicaoArmazenamento, PapelUsuario } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
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

  @Patch(':condicao')
  @Roles(PapelUsuario.ADMIN)
  atualizar(
    @Param('condicao', new ParseEnumPipe(CondicaoArmazenamento)) // 👈 validação aqui
    condicao: CondicaoArmazenamento,
    @Body() dto: UpdateRegraValidadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.atualizar(
      condicao,
      dto.horasValidade,
      user.sub,
      user.papel,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';
import { UnidadesService } from './unidades.service.js';
import { CreateUnidadeDto } from './dto/create-unidade.dto.js';
import { UpdateUnidadeDto } from './dto/update-unidade.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.ADMIN)
@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Post()
  create(
    @Body() dto: CreateUnidadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.unidadesService.create(dto, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  // ?includeInativas=true retorna também as unidades desativadas
  // (necessário para a tela de gestão poder reativá-las).
  @Get()
  findAll(@Query('includeInativas') includeInativas?: string) {
    return this.unidadesService.findAll(includeInativas === 'true');
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.unidadesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnidadeDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.unidadesService.update(id, dto, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  @Delete(':id')
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.unidadesService.remove(id, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }
}

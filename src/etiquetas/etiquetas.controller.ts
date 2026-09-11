import {
  Controller,
  Post,
  Patch,
  Get,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EtiquetasService } from './etiquetas.service.js';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentDevice, AuthenticatedDevice } from '../auth/decorators/current-device.decorator.js';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { CriarEtiquetaDto } from './dto/criar-etiqueta.dto.js';
import { ReimprimirEtiquetaDto } from './dto/reimprimir-etiqueta.dto.js';
import { AtualizarStatusEtiquetaDto } from './dto/atualizar-status-etiqueta.dto.js';
import { ListarEtiquetasDto } from './dto/listar-etiquetas.dto.js';
import { PapelUsuario } from '@prisma/client';

@Controller('etiquetas')
export class EtiquetasController {
  constructor(private readonly etiquetasService: EtiquetasService) {}

  // ---- Rotas autenticadas por DISPOSITIVO (padronizado com DispositivoGuard) ----
  // @Public() faz o JwtAuthGuard global ignorar; DispositivoGuard assume a autenticação.

  @Public()
  @UseGuards(DispositivoGuard)
  @Post()
  criar(@Body() dto: CriarEtiquetaDto, @CurrentDevice() dispositivo: AuthenticatedDevice) {
    return this.etiquetasService.criar(dto, dispositivo);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Post(':id/reimprimir')
  reimprimir(
    @Param('id') id: string,
    @Body() dto: ReimprimirEtiquetaDto,
    @CurrentDevice() dispositivo: AuthenticatedDevice,
  ) {
    return this.etiquetasService.reimprimir(id, dto, dispositivo);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Patch(':id/status')
  atualizarStatus(
    @Param('id') id: string,
    @Body() dto: AtualizarStatusEtiquetaDto,
    @CurrentDevice() dispositivo: AuthenticatedDevice,
  ) {
    return this.etiquetasService.atualizarStatus(id, dto, dispositivo);
  }

  // ---- Rotas autenticadas por USUÁRIO (JWT global) — AUDITOR bloqueado ----

  @Roles(PapelUsuario.ADMIN, PapelUsuario.EMISSOR)
  @UseGuards(RolesGuard)
  @Get()
  listar(@Query() filtros: ListarEtiquetasDto, @CurrentUser() usuario: AuthenticatedUser) {
    return this.etiquetasService.listar(usuario.unidadeId, filtros);
  }

  @Roles(PapelUsuario.ADMIN, PapelUsuario.EMISSOR)
  @UseGuards(RolesGuard)
  @Get(':id')
  buscarPorId(@Param('id') id: string, @CurrentUser() usuario: AuthenticatedUser) {
    return this.etiquetasService.buscarPorId(id, usuario.unidadeId);
  }
}

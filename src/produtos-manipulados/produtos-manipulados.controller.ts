import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, UseGuards,
} from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';
import { ProdutosManipuladosService } from './produtos-manipulados.service.js';
import { CreateProdutoManipuladoDto } from './dto/create-produto-manipulado.dto.js';
import { UpdateProdutoManipuladoDto } from './dto/update-produto-manipulado.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard.js';
import { RequestWithDispositivo } from '../dispositivos/request-with-dispositivo.js';
import { SyncApiKeyGuard } from '../sync-outbox/sync-api-key.guard.js'; // 🆕

@Controller('produtos-manipulados')
export class ProdutosManipuladosController {
  constructor(private readonly service: ProdutosManipuladosService) {}

  @Public()
  @UseGuards(DispositivoGuard)
  @Post()
  create(@Body() dto: CreateProdutoManipuladoDto, @Req() req: RequestWithDispositivo) {
    return this.service.create(dto, req.dispositivo.unidadeId, {
      dispositivoId: req.dispositivo.id,
    });
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Get()
  findAll(@Req() req: RequestWithDispositivo) {
    return this.service.findAll(req.dispositivo.unidadeId);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: RequestWithDispositivo) {
    return this.service.findOne(id, req.dispositivo.unidadeId);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoManipuladoDto,
    @Req() req: RequestWithDispositivo,
  ) {
    return this.service.update(id, dto, req.dispositivo.unidadeId, {
      dispositivoId: req.dispositivo.id,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Get('admin/listar')
  findAllAdmin(
    @CurrentUser() user: AuthenticatedUser,
    @Query('incluirInativos') incluirInativos?: string,
  ) {
    return this.service.findAllAdmin(user.unidadeId, incluirInativos === 'true');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Patch('admin/:id')
  updateAdmin(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoManipuladoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user.unidadeId, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user);
  }

  /**
   * 🆕 Endpoints de sincronização usados exclusivamente pelo Sync Worker (local -> cloud).
   * Protegidos por SyncApiKeyGuard.
   */
  @Public()
  @UseGuards(SyncApiKeyGuard)
  @Post('sync')
  sincronizarCriacao(@Body() payload: any) {
    return this.service.upsertParaSync(payload);
  }

  @Public()
  @UseGuards(SyncApiKeyGuard)
  @Patch(':id/sync')
  sincronizarAtualizacao(@Param('id') id: string, @Body() payload: any) {
    return this.service.upsertParaSync({ ...payload, id });
  }
}

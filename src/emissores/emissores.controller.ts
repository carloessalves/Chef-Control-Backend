import {
  Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';
import { EmissoresService } from './emissores.service.js';
import { CreateEmissorDto } from './dto/create-emissor.dto.js';
import { UpdateEmissorDto } from './dto/update-emissor.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard';
import { RequestWithDispositivo } from '../dispositivos/request-with-dispositivo.js';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser, AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { SyncApiKeyGuard } from '../sync-outbox/sync-api-key.guard.js'; // 🆕

@Controller('emissores')
export class EmissoresController {
  constructor(private readonly emissoresService: EmissoresService) {}

  @Public()
  @UseGuards(DispositivoGuard)
  @Post()
  create(@Body() dto: CreateEmissorDto, @Req() req: RequestWithDispositivo) {
    return this.emissoresService.create(dto, req.dispositivo.unidadeId, {
      dispositivoId: req.dispositivo.id,
    });
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Get()
  findAll(@Req() req: RequestWithDispositivo) {
    return this.emissoresService.findAll(req.dispositivo.unidadeId);
  }

  @Public()
  @UseGuards(DispositivoGuard)
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithDispositivo) {
    return this.emissoresService.findOne(id, req.dispositivo.unidadeId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmissorDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.emissoresService.update(id, dto, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.emissoresService.remove(id, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  /**
   * 🆕 Endpoints de sincronização usados exclusivamente pelo Sync Worker (local -> cloud).
   * Protegidos por SyncApiKeyGuard — nunca expostos a clientes finais.
   */
  @UseGuards(SyncApiKeyGuard)
  @Post('sync')
  sincronizarCriacao(@Body() payload: any) {
    return this.emissoresService.upsertParaSync(payload);
  }

  @UseGuards(SyncApiKeyGuard)
  @Patch(':id/sync')
  sincronizarAtualizacao(@Param('id') id: string, @Body() payload: any) {
    return this.emissoresService.upsertParaSync({ ...payload, id });
  }
}

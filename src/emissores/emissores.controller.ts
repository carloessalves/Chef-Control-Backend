import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  ParseUUIDPipe,
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

@Controller('emissores')
export class EmissoresController {
  constructor(private readonly emissoresService: EmissoresService) {}

  // Fluxo operacional (tela de identificação do emissor) — sem login,
  // mas exige tablet pareado (x-device-id válido).
  @UseGuards(DispositivoGuard)
  @Post()
  create(
    @Body() dto: CreateEmissorDto,
    @Req() req: RequestWithDispositivo,
  ) {
    return this.emissoresService.create(dto, req.dispositivo.unidadeId);
  }

  @UseGuards(DispositivoGuard)
  @Get()
  findAll(@Req() req: RequestWithDispositivo) {
    return this.emissoresService.findAll(req.dispositivo.unidadeId);
  }

  @UseGuards(DispositivoGuard)
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithDispositivo,
  ) {
    return this.emissoresService.findOne(id, req.dispositivo.unidadeId);
  }

  // Gestão administrativa — exige login (ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmissorDto,
  ) {
    return this.emissoresService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.emissoresService.remove(id);
  }
}

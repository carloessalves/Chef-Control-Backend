import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditoriaService } from './auditoria.service.js';
import { FindAuditoriaDto } from './dto/find-auditoria.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PapelUsuario } from '@prisma/client';

@Controller('auditoria')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditoriaController {
  constructor(private readonly auditoriaService: AuditoriaService) {}

  @Get()
  @Roles(PapelUsuario.ADMIN)
  findAll(@Query() query: FindAuditoriaDto) {
    return this.auditoriaService.findAll({
      entidade: query.entidade,
      entidadeId: query.entidadeId,
      usuarioId: query.usuarioId,
      tipoEvento: query.tipoEvento,
      dataInicio: query.dataInicio ? new Date(query.dataInicio) : undefined,
      dataFim: query.dataFim ? new Date(query.dataFim) : undefined,
      page: query.page,
      pageSize: query.pageSize,
    });
  }
}

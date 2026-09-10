import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { PapelUsuario } from '@prisma/client';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard';
import { RequestWithDispositivo } from '../dispositivos/request-with-dispositivo.js';
import { ProdutosManipuladosService } from './produtos-manipulados.service';
import { CreateProdutoManipuladoDto } from './dto/create-produto-manipulado.dto';
import { UpdateProdutoManipuladoDto } from './dto/update-produto-manipulado.dto';

@Controller('produtos-manipulados')
export class ProdutosManipuladosController {
  constructor(private readonly service: ProdutosManipuladosService) {}

  // Fluxo operacional (tela "Produtos", sem PIN) — exige tablet pareado.
  @UseGuards(DispositivoGuard)
  @Post()
  create(
    @Body() dto: CreateProdutoManipuladoDto,
    @Req() req: RequestWithDispositivo,
  ) {
    return this.service.create(dto, req.dispositivo.unidadeId);
  }

  @UseGuards(DispositivoGuard)
  @Get()
  findAll(@Req() req: RequestWithDispositivo) {
    return this.service.findAll(req.dispositivo.unidadeId);
  }

  @UseGuards(DispositivoGuard)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithDispositivo,
  ) {
    return this.service.findOne(id, req.dispositivo.unidadeId);
  }

  @UseGuards(DispositivoGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProdutoManipuladoDto,
    @Req() req: RequestWithDispositivo,
  ) {
    return this.service.update(id, dto, req.dispositivo.unidadeId);
  }

  // Exclusão (soft delete) é sensível — exige login + papel ADMIN.
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user);
  }
}

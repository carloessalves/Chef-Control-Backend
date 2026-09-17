// src/categorias-produto/categorias-produto.controller.ts

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
} from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';
import { CategoriasProdutoService } from './categorias-produto.service.js';
import { CreateCategoriaProdutoDto } from './dto/create-categoria-produto.dto.js';
import { UpdateCategoriaProdutoDto } from './dto/update-categoria-produto.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { DispositivoGuard } from '../dispositivos/dispositivo.guard.js';

@Controller('categorias-produto')
export class CategoriasProdutoController {
  constructor(
    private readonly categoriasProdutoService: CategoriasProdutoService,
  ) {}

  // Fluxo operacional (tela "Produtos", sem PIN) — exige tablet pareado.
  // Categorias são globais (não têm unidadeId); só filtra ativas.
  @Public()
  @UseGuards(DispositivoGuard)
  @Get('publicas')
  findAllPublicas() {
    return this.categoriasProdutoService.findAll(true);
  }

  // ---------- Fluxo administrativo (login) ----------

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Post()
  create(
    @Body() dto: CreateCategoriaProdutoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriasProdutoService.create(dto, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll(@Query('ativas') ativas?: string) {
    return this.categoriasProdutoService.findAll(ativas === 'true');
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriasProdutoService.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoriaProdutoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriasProdutoService.update(id, dto, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriasProdutoService.remove(id, {
      usuarioId: user.sub,
      papelNoMomento: user.papel,
    });
  }
}

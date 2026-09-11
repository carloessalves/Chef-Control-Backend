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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('categorias-produto')
export class CategoriasProdutoController {
  constructor(
    private readonly categoriasProdutoService: CategoriasProdutoService,
  ) {}

  // Somente ADMIN cria categorias
  @Roles(PapelUsuario.ADMIN)
  @Post()
  create(@Body() dto: CreateCategoriaProdutoDto) {
    return this.categoriasProdutoService.create(dto);
  }

  // Qualquer usuário autenticado pode listar (ex: tela de cadastro de produto)
  @Get()
  findAll(@Query('ativas') ativas?: string) {
    return this.categoriasProdutoService.findAll(ativas === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriasProdutoService.findOne(id);
  }

  // Somente ADMIN edita categorias
  @Roles(PapelUsuario.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaProdutoDto) {
    return this.categoriasProdutoService.update(id, dto);
  }

  // Somente ADMIN desativa categorias
  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriasProdutoService.remove(id);
  }
}

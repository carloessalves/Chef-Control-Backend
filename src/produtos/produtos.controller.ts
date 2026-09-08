// src/produtos/produtos.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ProdutosService } from './produtos.service.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { UpdateProdutoDto } from './dto/update-produto.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../rbac/permissions.guard.js';
import { RequirePermissions } from '../rbac/permissions.decorator.js';
import { PermissionAction } from '../rbac/permissions.enum.js';

@Controller('produtos')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProdutosController {
  constructor(private readonly service: ProdutosService) {}

  @Post()
  @RequirePermissions(PermissionAction.MANAGE_PRODUCTS)
  create(@Body() dto: CreateProdutoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('categoriaId') categoriaId?: string) {
    if (categoriaId) return this.service.findByCategoria(categoriaId);
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionAction.MANAGE_PRODUCTS)
  update(@Param('id') id: string, @Body() dto: UpdateProdutoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionAction.MANAGE_PRODUCTS)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

// src/categorias/categorias.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CategoriasService } from './categorias.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../rbac/permissions.guard.js';
import { RequirePermissions } from '../rbac/permissions.decorator.js';
import { PermissionAction } from '../rbac/permissions.enum.js';

@Controller('categorias')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CategoriasController {
  constructor(private readonly service: CategoriasService) {}

  @Post()
  @RequirePermissions(PermissionAction.MANAGE_PRODUCTS)
  create(@Body() dto: CreateCategoriaDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionAction.MANAGE_PRODUCTS)
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionAction.MANAGE_PRODUCTS)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

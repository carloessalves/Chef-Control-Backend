// src/usuarios/usuarios.controller.ts
import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { PermissionsGuard } from '../rbac/permissions.guard.js';
import { RequirePermissions } from '../rbac/permissions.decorator.js';
import { PermissionAction } from '../rbac/permissions.enum.js';

@Controller('usuarios')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Post()
  @RequirePermissions(PermissionAction.MANAGE_USERS)
  create(@Body() dto: CreateUsuarioDto) {
    return this.service.create(dto);
  }

  @Get()
  @RequirePermissions(PermissionAction.MANAGE_USERS)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @RequirePermissions(PermissionAction.MANAGE_USERS)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}

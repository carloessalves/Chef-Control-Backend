import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { PapelUsuario } from '@prisma/client';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';

@Controller('usuarios')
export class UsuariosController {
  constructor(private usuariosService: UsuariosService) {}

  // Somente ADMIN cria usuários (evita autoatribuição de papel elevado)
  @Roles(PapelUsuario.ADMIN)
  @Post()
  create(
    @Body() dto: CreateUsuarioDto,
    @CurrentUser() requester: AuthenticatedUser,
  ) {
    return this.usuariosService.create(dto, requester);
  }

  @Get()
  findAll(@CurrentUser() requester: AuthenticatedUser) {
    return this.usuariosService.findAll(requester);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ) {
    return this.usuariosService.findOne(id, requester);
  }

  @Roles(PapelUsuario.ADMIN)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @CurrentUser() requester: AuthenticatedUser,
  ) {
    return this.usuariosService.update(id, dto, requester);
  }

  @Roles(PapelUsuario.ADMIN)
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ) {
    return this.usuariosService.remove(id, requester);
  }
}

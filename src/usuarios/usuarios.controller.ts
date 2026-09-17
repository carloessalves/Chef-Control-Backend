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
import { AtualizarProprioPinDto } from './dto/atualizar-proprio-pin.dto';
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

  // ADMIN e AUDITOR podem consultar; EMISSOR não tem acesso aos dados de usuários
  @Roles(PapelUsuario.ADMIN, PapelUsuario.AUDITOR)
  @Get()
  findAll(@CurrentUser() requester: AuthenticatedUser) {
    return this.usuariosService.findAll(requester);
  }

  @Roles(PapelUsuario.ADMIN, PapelUsuario.AUDITOR)
  @Get(':id')
  findOne(
    @Param('id') id: string,
    @CurrentUser() requester: AuthenticatedUser,
  ) {
    return this.usuariosService.findOne(id, requester);
  }

  // Self-service: qualquer usuário autenticado pode trocar o próprio PIN.
  // Precisa vir ANTES de "@Patch(':id')" para não ser capturada como :id="me".
  @Patch('me/pin')
  updateOwnPin(
    @Body() dto: AtualizarProprioPinDto,
    @CurrentUser() requester: AuthenticatedUser,
  ) {
    return this.usuariosService.updateOwnPin(dto, requester);
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

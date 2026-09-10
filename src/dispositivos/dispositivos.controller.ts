import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { PapelUsuario } from '@prisma/client';
import { DispositivosService } from './dispositivos.service';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';

// Todo o módulo é administrativo: pareamento e gestão de tablets/dispositivos.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.ADMIN)
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly service: DispositivosService) {}

  // Ação única feita pelo ADMIN ao configurar um tablet novo na unidade.
  @Post('vincular')
  vincular(
    @Body() dto: VincularDispositivoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.vincular(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.service.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDispositivoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user);
  }
}

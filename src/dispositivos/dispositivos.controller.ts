import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import {
  CurrentUser,
  AuthenticatedUser,
} from '../auth/decorators/current-user.decorator';
import { PapelUsuario } from '@prisma/client';
import { DispositivosService } from './dispositivos.service';
import { VincularDispositivoDto } from './dto/vincular-dispositivo.dto';
import { VincularComLoginDto } from './dto/vincular-com-login.dto';
import { UpdateDispositivoDto } from './dto/update-dispositivo.dto';
import { FindAllDispositivosDto } from './dto/find-all-dispositivos.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(PapelUsuario.ADMIN)
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly service: DispositivosService) {}

  // Bootstrap: tablet novo, sem JWT e sem device vinculado.
  @Public()
  @Roles()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('vincular-com-login')
  @HttpCode(HttpStatus.OK)
  vincularComLogin(@Body() dto: VincularComLoginDto) {
    return this.service.vincularComLogin(dto);
  }

  @Post('vincular')
  vincular(
    @Body() dto: VincularDispositivoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.vincular(dto, user);
  }

  @Get()
  findAll(
    @Query() query: FindAllDispositivosDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.findAll(user, query.incluirInativos ?? false);
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

  // Reativação manual pelo ADMIN, sem depender do fluxo /vincular
  // (que exige acesso físico ao dispositivo).
  @Patch(':id/reativar')
  reativar(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.reativar(id, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.remove(id, user);
  }
}

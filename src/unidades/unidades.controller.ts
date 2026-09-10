import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  ParseBoolPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UnidadesService } from './unidades.service.js';
import { CreateUnidadeDto } from './dto/create-unidade.dto.js';
import { UpdateUnidadeDto } from './dto/update-unidade.dto.js';

@Controller('unidades')
export class UnidadesController {
  constructor(private readonly unidadesService: UnidadesService) {}

  @Post()
  create(@Body() dto: CreateUnidadeDto) {
    return this.unidadesService.create(dto);
  }

  @Get()
  findAll(
    @Query('includeInativas', new DefaultValuePipe(false), ParseBoolPipe)
    includeInativas: boolean,
  ) {
    return this.unidadesService.findAll(includeInativas);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.unidadesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnidadeDto) {
    return this.unidadesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.unidadesService.remove(id);
  }
}

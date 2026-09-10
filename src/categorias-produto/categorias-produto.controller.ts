import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CategoriasProdutoService } from './categorias-produto.service.js';
import { CreateCategoriaProdutoDto } from './dto/create-categoria-produto.dto.js';
import { UpdateCategoriaProdutoDto } from './dto/update-categoria-produto.dto.js';

@Controller('categorias-produto')
export class CategoriasProdutoController {
  constructor(
    private readonly categoriasProdutoService: CategoriasProdutoService,
  ) {}

  @Post()
  create(@Body() dto: CreateCategoriaProdutoDto) {
    return this.categoriasProdutoService.create(dto);
  }

  @Get()
  findAll(@Query('ativas') ativas?: string) {
    return this.categoriasProdutoService.findAll(ativas === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriasProdutoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCategoriaProdutoDto) {
    return this.categoriasProdutoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriasProdutoService.remove(id);
  }
}

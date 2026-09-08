import { Module } from '@nestjs/common';
import { CategoriasService } from './categorias.service.js';
import { CategoriasController } from './categorias.controller.js';

@Module({
  providers: [CategoriasService],
  controllers: [CategoriasController],
})
export class CategoriasModule {}

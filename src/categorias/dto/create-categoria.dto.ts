// src/categorias/dto/create-categoria.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
}

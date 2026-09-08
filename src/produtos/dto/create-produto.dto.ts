// src/produtos/dto/create-produto.dto.ts
import { IsString, IsNotEmpty, IsNumber, IsPositive, IsUUID, IsOptional, IsBoolean } from 'class-validator';

export class CreateProdutoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  descricao?: string;

  @IsNumber()
  @IsPositive()
  preco: number;

  @IsUUID()
  categoriaId: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

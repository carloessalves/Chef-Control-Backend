import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateProdutoManipuladoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  alergenos?: string[];

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

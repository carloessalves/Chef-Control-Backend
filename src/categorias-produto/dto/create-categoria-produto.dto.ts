import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoriaProdutoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

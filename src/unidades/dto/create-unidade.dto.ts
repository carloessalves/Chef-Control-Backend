import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateUnidadeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsString()
  @IsOptional()
  @MaxLength(18) // formato 00.000.000/0001-00
  cnpj?: string;
}

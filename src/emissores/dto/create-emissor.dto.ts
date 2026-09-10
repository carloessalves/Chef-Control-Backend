import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateEmissorDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsNotEmpty()
  funcao: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  // unidadeId REMOVIDO — vem de req.dispositivo.unidadeId no controller
}

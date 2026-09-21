import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateEmissorDto {
  // Opcional — permite que o client (app offline) gere o UUID localmente.
  // Se não enviado, o backend gera automaticamente.
  @IsOptional()
  @IsUUID()
  id?: string;

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

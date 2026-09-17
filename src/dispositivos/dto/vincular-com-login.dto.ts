import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  MaxLength,
  Length,
  Matches,
} from 'class-validator';

export class VincularComLoginDto {
  // UUID gerado localmente pelo app/tablet na primeira execução
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O identificador do dispositivo deve ser um UUID v4 válido.' })
  identificador: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nomeDispositivo?: string;

  // Nome do usuário (ADMIN) digitado manualmente na tela de bootstrap.
  @IsString()
  @IsNotEmpty()
  nomeUsuario: string;

  @IsString()
  @Length(4, 4, { message: 'O PIN deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O PIN deve conter apenas números.' })
  pin: string;
}

import {
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
  IsBoolean,
  Length,
  Matches,
} from 'class-validator';
import { PapelUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @IsString()
  nome: string;

  @IsOptional()
  @IsString()
  funcao?: string;

  @IsEnum(PapelUsuario, {
    message: 'papel deve ser ADMIN, EMISSOR ou AUDITOR.',
  })
  papel: PapelUsuario;

  @IsString()
  @Length(4, 4, { message: 'O PIN deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O PIN deve conter apenas números.' })
  pin: string;

  @IsUUID()
  unidadeId: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

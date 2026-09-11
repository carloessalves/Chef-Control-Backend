import { IsUUID, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { CondicaoArmazenamento } from '@prisma/client';

export class CriarEtiquetaDto {
  @IsUUID()
  produtoId: string;

  @IsUUID()
  emissorId: string;

  @IsEnum(CondicaoArmazenamento)
  condicao: CondicaoArmazenamento;

  @IsOptional()
  @IsString()
  lote?: string;

  @IsOptional()
  @IsDateString()
  dataManipulacao?: string; // se não enviado, usa a data/hora atual
}

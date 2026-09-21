import { IsUUID, IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { CondicaoArmazenamento } from '@prisma/client';

export class CriarEtiquetaDto {
  @IsOptional()
  @IsUUID()
  id?: string; // gerado pelo client (impressão imediata offline/online)

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
  dataManipulacao?: string;
}

import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator';
import { StatusEtiqueta } from '@prisma/client';

export class ListarEtiquetasDto {
  @IsOptional()
  @IsEnum(StatusEtiqueta)
  status?: StatusEtiqueta;

  @IsOptional()
  @IsUUID()
  produtoId?: string;

  @IsOptional()
  @IsUUID()
  emissorId?: string;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;
}

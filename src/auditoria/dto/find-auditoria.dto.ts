import { IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EntidadeAuditoria, TipoEvento } from '@prisma/client';

export class FindAuditoriaDto {
  @IsOptional()
  @IsEnum(EntidadeAuditoria)
  entidade?: EntidadeAuditoria;

  @IsOptional()
  @IsUUID()
  entidadeId?: string;

  @IsOptional()
  @IsUUID()
  usuarioId?: string;

  @IsOptional()
  @IsEnum(TipoEvento)
  tipoEvento?: TipoEvento;

  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}

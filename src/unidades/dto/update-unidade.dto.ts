import { PartialType } from '@nestjs/mapped-types';
import { CreateUnidadeDto } from './create-unidade.dto.js';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateUnidadeDto extends PartialType(CreateUnidadeDto) {
  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}

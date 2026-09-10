import { IsEnum, IsInt, Min } from 'class-validator';
import { CondicaoArmazenamento } from '@prisma/client';

export class CreateRegraValidadeDto {
  @IsEnum(CondicaoArmazenamento)
  condicao: CondicaoArmazenamento;

  @IsInt()
  @Min(1)
  horasValidade: number;
}

import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class VincularDispositivoDto {
  @IsString()
  @IsNotEmpty()
  identificador: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nome?: string;
}

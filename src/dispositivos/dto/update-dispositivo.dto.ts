import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateDispositivoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nome: string;
}

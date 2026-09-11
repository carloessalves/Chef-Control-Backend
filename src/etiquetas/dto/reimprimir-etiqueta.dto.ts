import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class ReimprimirEtiquetaDto {
  @IsString()
  @IsNotEmpty({ message: 'O motivo da reimpressão é obrigatório.' })
  @MinLength(5, { message: 'O motivo deve ter no mínimo 5 caracteres.' })
  motivoReimpressao: string;
}

import { IsEnum, IsString, ValidateIf, IsNotEmpty } from 'class-validator';
import { StatusEtiqueta } from '@prisma/client';

export class AtualizarStatusEtiquetaDto {
  @IsEnum([StatusEtiqueta.CONSUMIDA, StatusEtiqueta.DESCARTADA], {
    message: 'Status deve ser CONSUMIDA ou DESCARTADA.',
  })
  status: StatusEtiqueta;

  @ValidateIf((dto) => dto.status === StatusEtiqueta.DESCARTADA)
  @IsString()
  @IsNotEmpty({ message: 'O motivo do descarte é obrigatório quando o status for DESCARTADA.' })
  motivoDescarte?: string;
}

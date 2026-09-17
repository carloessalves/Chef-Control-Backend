import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class VincularDispositivoDto {
  // Gerado localmente pelo app/tablet (ex: crypto.randomUUID()) na primeira execução
  // e persistido no dispositivo. Garante 122 bits de entropia — impossível adivinhar
  // ou forçar via header "x-device-id".
  @IsString()
  @IsNotEmpty()
  @IsUUID('4', { message: 'O identificador do dispositivo deve ser um UUID v4 válido.' })
  identificador: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  nome?: string;
}

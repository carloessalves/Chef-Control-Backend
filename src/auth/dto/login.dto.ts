import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsUUID()
  usuarioId: string;

  @IsString()
  @Length(4, 4, { message: 'O PIN deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O PIN deve conter apenas números.' })
  pin: string;
}

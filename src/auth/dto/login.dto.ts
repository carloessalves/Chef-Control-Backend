import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  nomeUsuario: string;

  @IsString()
  @Length(4, 4, { message: 'O PIN deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O PIN deve conter apenas números.' })
  pin: string;
}

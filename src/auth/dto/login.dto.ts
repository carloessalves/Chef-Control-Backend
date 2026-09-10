import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @Length(6, 6, { message: 'O PIN deve conter exatamente 6 dígitos.' })
  @Matches(/^\d{6}$/, { message: 'O PIN deve conter apenas números.' })
  pin: string;

  @IsUUID()
  unidadeId: string;
}

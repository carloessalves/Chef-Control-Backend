import { IsString, Length, Matches } from 'class-validator';

export class AtualizarProprioPinDto {
  @IsString()
  @Length(4, 4, { message: 'O PIN atual deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O PIN atual deve conter apenas números.' })
  pinAtual: string;

  @IsString()
  @Length(4, 4, { message: 'O novo PIN deve conter exatamente 4 dígitos.' })
  @Matches(/^\d{4}$/, { message: 'O novo PIN deve conter apenas números.' })
  novoPin: string;
}

import { IsString, Length } from 'class-validator';

export class UpdatePinDto {
  @IsString()
  @Length(4, 6, { message: 'PIN deve ter entre 4 e 6 dígitos' })
  pin: string;
}

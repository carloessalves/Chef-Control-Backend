// src/usuarios/dto/create-usuario.dto.ts
import { IsString, IsNotEmpty, Length, IsUUID } from 'class-validator';

export class CreateUsuarioDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @Length(4, 6)
  pin: string; // será hasheado no service

  @IsUUID()
  perfilId: string;
}

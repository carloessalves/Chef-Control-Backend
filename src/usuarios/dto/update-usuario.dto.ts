import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';

// PartialType torna todos os campos opcionais, incluindo o pin
// (se pin vier no body, o service faz novo hash; se não vier, mantém o atual)
export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateEmissorDto } from './create-emissor.dto.js';

export class UpdateEmissorDto extends PartialType(CreateEmissorDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateRegraValidadeDto } from './create-regra-validade.dto';

export class UpdateRegraValidadeDto extends PartialType(CreateRegraValidadeDto) {}

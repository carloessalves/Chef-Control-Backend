import { PartialType } from '@nestjs/mapped-types';
import { CreateProdutoManipuladoDto } from './create-produto-manipulado.dto';

export class UpdateProdutoManipuladoDto extends PartialType(
  CreateProdutoManipuladoDto,
) {}

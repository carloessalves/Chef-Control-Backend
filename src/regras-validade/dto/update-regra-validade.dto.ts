import { IsInt, Min } from 'class-validator';

export class UpdateRegraValidadeDto {
  @IsInt()
  @Min(1)
  horasValidade: number;
}

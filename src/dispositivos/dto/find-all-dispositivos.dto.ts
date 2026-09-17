// dto/find-all-dispositivos.dto.ts
import { Transform } from 'class-transformer';
import { IsOptional, IsBoolean } from 'class-validator';

export class FindAllDispositivosDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  incluirInativos?: boolean;
}

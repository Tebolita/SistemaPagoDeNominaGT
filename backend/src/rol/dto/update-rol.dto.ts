import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateRolDto } from './create-rol.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateRolDto extends PartialType(CreateRolDto) {
  @ApiPropertyOptional({
    description: 'Estado del rol. Determina si el rol puede ser asignado a nuevos usuarios.',
    example: true,
    default: true
  })
  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}
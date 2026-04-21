import { PartialType } from '@nestjs/mapped-types';
import { IsString, IsNumber, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateJornadaLaboralDto } from './create-jornada-laboral.dto';

export class UpdateJornadaLaboralDto extends PartialType(CreateJornadaLaboralDto) {
  @ApiPropertyOptional({
    description: 'Nombre de la jornada laboral',
    example: 'Jornada Ordinaria',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  NombreJornada?: string;

  @ApiPropertyOptional({
    description: 'Horas diarias de trabajo',
    example: 8,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(24)
  HorasDiarias?: number;

  @ApiPropertyOptional({
    description: 'Horas semanales de trabajo',
    example: 40,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(168)
  HorasSemanales?: number;
}

import { IsNumber, IsOptional, IsDate, Min, Max, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateNominaDto {
  @ApiProperty({
    description: 'Mes de la nómina',
    example: 4,
  })
  @IsNumber()
  @Min(1)
  @Max(12)
  Mes!: number;

  @ApiProperty({
    description: 'Año de la nómina',
    example: 2026,
  })
  @IsNumber()
  @Min(2000)
  Anio!: number;

  @ApiPropertyOptional({
    description: 'Quincena de la nómina',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(2)
  Quincena?: number;

  @ApiPropertyOptional({
    description: 'Fecha de generación de la nómina',
    example: '2026-04-19T00:00:00.000Z',
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  FechaGeneracion?: Date;

  @ApiPropertyOptional({
    description: 'Estado de la nómina',
    example: 'GENERADA',
  })
  @IsOptional()
  @IsString()
  Estado?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario responsable de la nómina',
    example: 2,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  IdUsuarioGerente?: number;

  @ApiPropertyOptional({
    description: 'ID del estado actual de la nómina',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  IdEstadoActual?: number;

  @ApiPropertyOptional({
    description: 'Activo/Activo lógico para la nómina',
    example: true,
  })
  @IsOptional()
  Activo?: boolean;
}

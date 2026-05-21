import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateParametroGlobalDto {
  @ApiProperty({
    description: 'Nombre del parámetro global',
    example: 'IGSS_EMPLEADO',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  NombreParametro: string;

  @ApiProperty({
    description: 'Valor numérico del parámetro',
    example: 3.67,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  Valor: number;

  @ApiPropertyOptional({
    description: 'Descripción del parámetro',
    example: 'Aporte IGSS descuento empleado (3.67%)',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  Descripcion?: string;

  @ApiPropertyOptional({
    description: 'Tipo: INGRESO, DESCUENTO o REFERENCIA',
    example: 'DESCUENTO',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  Tipo?: string;

  @ApiPropertyOptional({
    description: 'Unidad del valor: % o Q',
    example: '%',
  })
  @IsString()
  @IsOptional()
  @MaxLength(5)
  Unidad?: string;

  @ApiPropertyOptional({ description: 'Filtro: aplicar solo a este género (true=Femenino, false=Masculino)' })
  @IsOptional()
  FiltroGenero?: boolean | null;

  @ApiPropertyOptional({ description: 'Filtro: aplicar solo a empleados de este departamento' })
  @IsOptional()
  @IsNumber()
  FiltroIdDepartamento?: number | null;

  @ApiPropertyOptional({ description: 'Filtro: aplicar solo a empleados con este puesto' })
  @IsOptional()
  @IsNumber()
  FiltroIdPuesto?: number | null;

  @ApiPropertyOptional({ description: 'Filtro: aplicar solo a empleados con esta jornada' })
  @IsOptional()
  @IsNumber()
  FiltroIdJornada?: number | null;
}

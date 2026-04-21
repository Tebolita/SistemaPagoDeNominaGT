import { IsString, IsNumber, IsNotEmpty, IsOptional, MaxLength, Min } from 'class-validator';
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
}

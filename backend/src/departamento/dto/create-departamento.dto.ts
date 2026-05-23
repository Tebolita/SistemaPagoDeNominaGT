import { IsString, IsNotEmpty, MaxLength, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateDepartamentoDto {
  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Recursos Humanos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  NombreDepartamento: string;

  @ApiPropertyOptional({ description: 'Presupuesto mensual del departamento', example: 50000 })
  @IsOptional()
  @Transform(({ value }) => (value !== null && value !== undefined ? parseFloat(value) : value))
  @IsNumber()
  @Min(0)
  Presupuesto?: number;
}

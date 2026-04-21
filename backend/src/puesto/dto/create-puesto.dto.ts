import { IsString, IsNumber, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePuestoDto {
  @ApiProperty({
    description: 'Nombre del puesto',
    example: 'Gerente de Ventas',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  NombrePuesto: string;

  @ApiProperty({
    description: 'ID del departamento',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  IdDepartamento: number;
}

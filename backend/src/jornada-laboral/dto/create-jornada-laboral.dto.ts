import { IsString, IsNumber, IsNotEmpty, MaxLength, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJornadaLaboralDto {
  @ApiProperty({
    description: 'Nombre de la jornada laboral',
    example: 'Jornada Ordinaria',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  NombreJornada!: string;

  @ApiProperty({
    description: 'Horas diarias de trabajo',
    example: 8,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(24)
  HorasDiarias!: number;

  @ApiProperty({
    description: 'Horas semanales de trabajo',
    example: 40,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(168)
  HorasSemanales!: number;
}

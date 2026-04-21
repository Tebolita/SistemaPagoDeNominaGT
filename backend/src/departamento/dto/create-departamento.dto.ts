import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartamentoDto {
  @ApiProperty({
    description: 'Nombre del departamento',
    example: 'Recursos Humanos',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  NombreDepartamento: string;
}

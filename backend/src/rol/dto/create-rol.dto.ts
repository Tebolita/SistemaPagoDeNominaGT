import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRolDto {
  @ApiProperty({
    description: 'Nombre descriptivo del rol de usuario',
    example: 'Administrador',
    maxLength: 50
  })
  @IsString({ message: 'El nombre del rol debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
  @MaxLength(50, { message: 'El nombre del rol no puede exceder los 50 caracteres' })
  NombreRol!: string;
}
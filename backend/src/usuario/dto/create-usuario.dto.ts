import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsNotEmpty, MinLength, MaxLength, Matches } from 'class-validator';
import { Type } from 'class-transformer';
import { REGEX_CONTRASENA_SEGURA, MENSAJE_CONTRASENA } from 'src/common/politica-contrasena';

export class CreateUsuarioDto {
  @ApiProperty()
  @IsString()
  Username!: string;

  @ApiProperty({ description: 'Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(72, { message: 'La contraseña no puede superar los 72 caracteres' })
  @Matches(REGEX_CONTRASENA_SEGURA, { message: MENSAJE_CONTRASENA })
  Contrasena!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  Clave!: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  IdRol!: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  IdEmpleado!: number;
}

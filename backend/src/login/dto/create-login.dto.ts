import { IsEmail, IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoginDto {
  @ApiProperty({
    description: 'Correo de usuario único',
    example: 'usuario@ejemplo.com',
  })
  @IsEmail()
  @IsNotEmpty()
  Correo: string;

  @ApiProperty({
    description: 'Contraseña con mínimo 6 caracteres',
    example: 'Password123!',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(100)
  Contrasena: string;
}

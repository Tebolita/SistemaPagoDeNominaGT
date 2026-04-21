import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBancoDto {
  @ApiProperty({
    description: 'Nombre del banco',
    example: 'Banco Industrial',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  NombreBanco: string;
}

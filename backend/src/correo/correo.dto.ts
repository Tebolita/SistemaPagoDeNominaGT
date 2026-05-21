import { IsInt, IsOptional, IsPositive, IsEmail, IsString, MaxLength, IsArray } from 'class-validator';

export class EnviarBoletaDto {
  @IsInt()
  @IsPositive()
  IdNomina: number;
}

export class EnviarFacturaDto {
  @IsInt()
  @IsPositive()
  IdVenta: number;
}

export class EnviarNotificacionDto {
  @IsArray()
  @IsEmail({}, { each: true })
  Destinatarios: string[];

  @IsString()
  @MaxLength(200)
  Asunto: string;

  @IsString()
  @MaxLength(2000)
  Mensaje: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  NombreDestinatario?: string;
}

import { IsString, IsOptional, IsBoolean, IsEmail, IsIn, MaxLength } from 'class-validator';

export class CreateClienteDto {
  @IsString()
  @MaxLength(200)
  NombreCliente: string;

  @IsOptional()
  @IsString()
  @IsIn(['INDIVIDUAL', 'EMPRESA'])
  TipoCliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  NIT?: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  DPI?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  Correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  Telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  Direccion?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}

export class UpdateClienteDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  NombreCliente?: string;

  @IsOptional()
  @IsString()
  @IsIn(['INDIVIDUAL', 'EMPRESA'])
  TipoCliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  NIT?: string;

  @IsOptional()
  @IsString()
  @MaxLength(13)
  DPI?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  Correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(15)
  Telefono?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  Direccion?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}
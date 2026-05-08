import { IsString, IsOptional, IsNumber, IsInt, IsPositive, IsBoolean, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCuentaBancariaEmpresaDto {
  @IsInt()
  @IsPositive()
  IdBanco: number;

  @IsString()
  @MaxLength(50)
  NumeroCuenta: string;

  @IsString()
  @MaxLength(100)
  NombreCuenta: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  TipoCuenta?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  SaldoActual?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  Moneda?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}

export class UpdateCuentaBancariaEmpresaDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  IdBanco?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  NumeroCuenta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  NombreCuenta?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  TipoCuenta?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  SaldoActual?: number;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  Moneda?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}

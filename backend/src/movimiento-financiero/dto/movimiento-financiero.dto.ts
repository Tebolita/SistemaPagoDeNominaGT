import { IsString, IsOptional, IsNumber, IsInt, IsPositive, IsBoolean, MaxLength, Min, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateMovimientoFinancieroDto {
  @IsInt()
  @IsPositive()
  IdCuenta: number;

  @IsString()
  @MaxLength(20)
  TipoMovimiento: string; // INGRESO, EGRESO

  @IsString()
  @MaxLength(50)
  Categoria: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  Subcategoria?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  Monto: number;

  @IsOptional()
  @IsDateString()
  FechaMovimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  Referencia?: string;

  @IsInt()
  @IsPositive()
  IdUsuarioRegistra: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdVenta?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdNomina?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Notas?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}

export class UpdateMovimientoFinancieroDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  IdCuenta?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  TipoMovimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  Categoria?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  Subcategoria?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  Monto?: number;

  @IsOptional()
  @IsDateString()
  FechaMovimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  Referencia?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Notas?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}

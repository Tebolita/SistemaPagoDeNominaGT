import { IsString, IsOptional, IsNumber, IsPositive, IsIn, IsBoolean, MaxLength, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductoServicioDto {
  @IsString()
  @MaxLength(200)
  NombreProducto: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRODUCTO', 'SERVICIO'])
  TipoProducto?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  PrecioUnitario: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  CostoUnitario?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  UnidadMedida?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}

export class UpdateProductoServicioDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  NombreProducto?: string;

  @IsOptional()
  @IsString()
  @IsIn(['PRODUCTO', 'SERVICIO'])
  TipoProducto?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  PrecioUnitario?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  CostoUnitario?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  UnidadMedida?: string;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}
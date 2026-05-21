import { IsInt, IsOptional, IsString, IsDateString, IsNumber, IsPositive, IsIn, MaxLength, Min, ValidateNested, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class DetalleVentaDto {
  @IsInt()
  @IsPositive()
  IdProducto: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  Cantidad: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  PrecioUnitario: number;

  @IsOptional()
  @Transform(({ value }) => (value != null ? parseFloat(value) : 0))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  Descuento?: number;
}

export class CreateVentaDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  IdCliente?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdCuenta?: number;

  @IsOptional()
  @IsDateString()
  FechaVenta?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CONTADO', 'CREDITO'])
  TipoVenta?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  Descuento?: number;

  @IsOptional()
  @IsString()
  @IsIn(['PENDIENTE', 'PAGADO', 'CANCELADO', 'VENCIDO'])
  EstadoPago?: string;

  @IsOptional()
  @IsDateString()
  FechaVencimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Notas?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleVentaDto)
  Detalles: DetalleVentaDto[];
}

export class UpdateVentaDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  IdCliente?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdCuenta?: number;

  @IsOptional()
  @IsDateString()
  FechaVenta?: string;

  @IsOptional()
  @IsString()
  @IsIn(['CONTADO', 'CREDITO'])
  TipoVenta?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  Descuento?: number;

  @IsOptional()
  @IsString()
  @IsIn(['PENDIENTE', 'PAGADO', 'CANCELADO', 'VENCIDO'])
  EstadoPago?: string;

  @IsOptional()
  @IsDateString()
  FechaVencimiento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Notas?: string;
}
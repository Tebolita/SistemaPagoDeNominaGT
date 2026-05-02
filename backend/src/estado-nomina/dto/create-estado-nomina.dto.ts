import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';

export class CreateEstadoNominaDto {
  @IsString()
  @MaxLength(50)
  NombreEstado: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  Descripcion?: string;

  @IsInt()
  @Min(1)
  Orden: number;

  @IsOptional()
  @IsBoolean()
  RequiereAprobacion?: boolean;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;
}
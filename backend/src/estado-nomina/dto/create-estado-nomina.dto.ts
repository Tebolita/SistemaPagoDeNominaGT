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
  @Min(0)
  Orden: number;

  @IsOptional()
  @IsBoolean()
  RequiereAprobacion?: boolean;

  @IsOptional()
  @IsBoolean()
  Activo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  Color?: string;

  @IsOptional()
  @IsBoolean()
  EsFinal?: boolean;

  @IsOptional()
  @IsBoolean()
  EsCancelacion?: boolean;
}

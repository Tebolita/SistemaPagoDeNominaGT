import { IsInt, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CambiarEstadoNominaDto {
  @IsInt()
  @Min(1)
  IdNomina: number;

  @IsInt()
  @Min(1)
  IdEstadoNuevo: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  Comentarios?: string;
}
import { IsInt, IsOptional, IsBoolean, IsPositive } from 'class-validator';
import { Transform } from 'class-transformer';

export class SimularParametroDto {
  @IsInt()
  @IsPositive()
  IdParametro: number;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === null ? undefined : value)
  Genero?: boolean;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdDepartamento?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdPuesto?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  IdJornada?: number;
}

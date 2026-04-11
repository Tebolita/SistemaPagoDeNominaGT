import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsNumber, 
    IsString, 
    IsNotEmpty, 
    IsDate, 
    IsOptional, 
    IsBoolean 
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateIncidenciaDto {
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    IdEmpleado!: number;

    @ApiProperty({ description: 'Ej: Falta, Suspension, IGSS, Vacaciones' })
    @IsString()
    @IsNotEmpty()
    TipoIncidencia!: string;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    FechaInicio!: Date;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    FechaFin!: Date;

    @ApiPropertyOptional({ default: false })
    @IsOptional()
    @IsBoolean()
    ConGoceSueldo?: boolean;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    IdUsuarioAutoriza!: number;
}
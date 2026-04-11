import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsNumber,
    IsNotEmpty, 
    IsDate, 
    IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';


export class CreateAsistenciaDto {
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    IdEmpleado!: number;

    @ApiProperty({ description: 'Formato YYYY-MM-DD' })
    @Type(() => Date)
    @IsDate()
    @IsNotEmpty()
    Fecha!: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    HoraEntrada?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    HoraSalida?: Date;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    HorasExtra?: number;
}

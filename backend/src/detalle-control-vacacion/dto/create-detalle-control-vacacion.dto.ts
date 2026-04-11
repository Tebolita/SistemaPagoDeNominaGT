import { ApiProperty } from '@nestjs/swagger';
import { 
    IsNumber, 
    IsNotEmpty, 
} from 'class-validator';
import { Type } from 'class-transformer';


export class CreateDetalleControlVacacionDto {
    @ApiProperty({ description: 'ID de la bolsa anual de vacaciones de donde se restan' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    IdControlVacacion!: number;

    @ApiProperty({ description: 'ID de la incidencia (ausencia física) relacionada' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    IdIncidencia!: number;

    @ApiProperty({ description: 'Cantidad de días a descontar (puede incluir decimales)' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    DiasDescontados!: number;
}

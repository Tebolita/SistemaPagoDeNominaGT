import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
    IsNumber,
    IsNotEmpty, 
    IsOptional
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateControlVacacionDto {
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    IdEmpleado!: number;

    @ApiProperty({ description: 'Año al que corresponde la bolsa de vacaciones' })
    @Type(() => Number)
    @IsNumber()
    @IsNotEmpty()
    AnioCorriente!: number;

    @ApiPropertyOptional({ default: 15 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    DiasGanados?: number;

    @ApiPropertyOptional({ default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    DiasGozados?: number;
}

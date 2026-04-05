import { IsString, IsNumber, IsNotEmpty, IsEmail, IsDate, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateEmpleadoDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    DPI!: string;

    @ApiProperty()
    @IsString()
    NIT!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    Nombres!: string;

    @ApiProperty()
    @IsString()
    Apellidos!: string

    @ApiProperty()
    @IsEmail()
    CorreoPersonal!: string

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    FechaIngresa!: Date;

    @ApiProperty()
    @IsNumber()
    IdPuesto!: number;

    @ApiProperty()
    @IsBoolean()
    Estado!: boolean;

    @ApiProperty()
    @Type(() => Date)
    @IsDate()
    FechaEliminacion!: Date;

 
    @ApiProperty()
    @IsNumber()
    Telefono!: number;

    @ApiProperty()
    @IsBoolean()
    Genero!: boolean;

    @ApiProperty()
    @IsString()
    EstadoCivil!: string

    @ApiProperty()
    @IsString()
    Direccion!: string 
}

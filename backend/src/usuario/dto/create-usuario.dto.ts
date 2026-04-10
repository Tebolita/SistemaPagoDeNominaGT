import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";

export class CreateUsuarioDto {
    @ApiProperty()
    @IsString()
    Username!: string;

    @ApiProperty()
    @IsString()
    Contrasena!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    Clave!: string;

    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    IdRol!: number;
    
    @ApiProperty()
    @Type(() => Number)
    @IsNumber()
    IdEmpleado!: number;

}

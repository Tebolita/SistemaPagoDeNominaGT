import { IsNotEmpty, IsString, IsNumber, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class ValidateLoginDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    Username: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    Contrasena: string;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    Clave: number;
}

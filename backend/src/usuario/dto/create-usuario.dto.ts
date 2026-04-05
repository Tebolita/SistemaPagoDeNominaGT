import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";
export class CreateUsuarioDto {
    @ApiProperty()
    @IsString()
    Username: string;

    @ApiProperty()
    @IsString()
    Contrasena: string;

    @ApiProperty()
    @IsNumber()
    Clave: number;
}

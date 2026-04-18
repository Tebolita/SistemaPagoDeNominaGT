import { IsString, IsNumber, IsNotEmpty, IsEmail, IsDate, IsBoolean, IsOptional, MaxLength, IsNumberString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";

export class CreateEmpleadoDto {
    @ApiProperty({ description: 'DPI de 13 dígitos sin guiones' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(13)
    DPI!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    NIT!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    Nombres!: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    Apellidos!: string;

    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    CorreoPersonal!: string;

    // Es opcional en la creación porque la BD tiene DEFAULT GETDATE()
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    FechaIngresa?: Date | null;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    IdPuesto!: number;

    @ApiProperty()
    @IsNumber()
    @IsNotEmpty()
    IdJornada!: number;

    @ApiProperty()
    @Type(() => String)
    @IsNumberString()
    @IsNotEmpty()
    Telefono!: string;

    @ApiProperty()
    @IsBoolean()
    @IsNotEmpty()
    Genero!: boolean;

    // Opcional según esquema de BD
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    EstadoCivil?: string;

    // Opcional según esquema de BD
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    Direccion?: string;

    // Opcional según esquema de BD
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    Fotografia?: string;

    // Agregado: Opcional, para transferencias bancarias
    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    IdBanco?: number;

    // Agregado: Opcional, cuenta del banco
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    CuentaBancaria?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    Activo?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    FechaEliminacion?: Date;
}
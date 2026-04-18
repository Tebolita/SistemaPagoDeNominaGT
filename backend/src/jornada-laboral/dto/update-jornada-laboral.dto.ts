import { PartialType } from '@nestjs/mapped-types';
import { CreateJornadaLaboralDto } from './create-jornada-laboral.dto';

export class UpdateJornadaLaboralDto extends PartialType(CreateJornadaLaboralDto) {}

import { PartialType } from '@nestjs/mapped-types';
import { CreateEstadoNominaDto } from './create-estado-nomina.dto';

export class UpdateEstadoNominaDto extends PartialType(CreateEstadoNominaDto) {}
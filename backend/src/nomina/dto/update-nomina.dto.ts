import { PartialType } from '@nestjs/mapped-types';
import { CreateNominaDto } from './create-nomina.dto';

export class UpdateNominaDto extends PartialType(CreateNominaDto) {
  // Hereda validaciones de CreateNominaDto
}

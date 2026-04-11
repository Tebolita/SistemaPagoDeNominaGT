import { PartialType } from '@nestjs/swagger';
import { CreateControlVacacionDto } from './create-control-vacacion.dto';

export class UpdateControlVacacionDto extends PartialType(CreateControlVacacionDto) {}

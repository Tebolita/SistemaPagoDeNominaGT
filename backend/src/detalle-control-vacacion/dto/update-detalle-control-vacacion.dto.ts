import { PartialType } from '@nestjs/swagger';
import { CreateDetalleControlVacacionDto } from './create-detalle-control-vacacion.dto';

export class UpdateDetalleControlVacacionDto extends PartialType(CreateDetalleControlVacacionDto) {}

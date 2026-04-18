import { PartialType } from '@nestjs/mapped-types';
import { CreateParametroGlobalDto } from './create-parametro-global.dto';

export class UpdateParametroGlobalDto extends PartialType(CreateParametroGlobalDto) {}

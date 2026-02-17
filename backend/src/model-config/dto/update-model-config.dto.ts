import { PartialType } from '@nestjs/swagger';
import { CreateModelConfigDto } from './create-model-config.dto';

export class UpdateModelConfigDto extends PartialType(CreateModelConfigDto) {}

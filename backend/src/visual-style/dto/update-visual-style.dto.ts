import { PartialType } from '@nestjs/swagger';
import { CreateVisualStyleDto } from './create-visual-style.dto';

export class UpdateVisualStyleDto extends PartialType(CreateVisualStyleDto) {}

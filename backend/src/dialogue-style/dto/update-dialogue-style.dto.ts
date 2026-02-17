import { PartialType } from '@nestjs/swagger';
import { CreateDialogueStyleDto } from './create-dialogue-style.dto';

export class UpdateDialogueStyleDto extends PartialType(
  CreateDialogueStyleDto,
) {}

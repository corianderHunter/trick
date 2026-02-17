import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DialogueStyle } from '../entities/dialogue-style.entity';
import { DialogueStyleController } from './dialogue-style.controller';
import { DialogueStyleService } from './dialogue-style.service';

@Module({
  imports: [TypeOrmModule.forFeature([DialogueStyle])],
  controllers: [DialogueStyleController],
  providers: [DialogueStyleService],
  exports: [DialogueStyleService],
})
export class DialogueStyleModule {}

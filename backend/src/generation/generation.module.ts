import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationTask } from '../entities/generation-task.entity';
import { ModelConfigModule } from '../model-config/model-config.module';
import { DialogueStyleModule } from '../dialogue-style/dialogue-style.module';
import { VisualStyleModule } from '../visual-style/visual-style.module';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([GenerationTask]),
    ModelConfigModule,
    DialogueStyleModule,
    VisualStyleModule,
  ],
  controllers: [GenerationController],
  providers: [GenerationService],
})
export class GenerationModule {}

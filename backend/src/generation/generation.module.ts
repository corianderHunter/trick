import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerationTask } from '../entities/generation-task.entity';
import { ModelConfigModule } from '../model-config/model-config.module';
import { GenerationController } from './generation.controller';
import { GenerationService } from './generation.service';

@Module({
  imports: [TypeOrmModule.forFeature([GenerationTask]), ModelConfigModule],
  controllers: [GenerationController],
  providers: [GenerationService],
})
export class GenerationModule {}

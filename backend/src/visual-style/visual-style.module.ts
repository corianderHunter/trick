import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisualStyle } from '../entities/visual-style.entity';
import { VisualStyleController } from './visual-style.controller';
import { VisualStyleService } from './visual-style.service';

@Module({
  imports: [TypeOrmModule.forFeature([VisualStyle])],
  controllers: [VisualStyleController],
  providers: [VisualStyleService],
  exports: [VisualStyleService],
})
export class VisualStyleModule {}

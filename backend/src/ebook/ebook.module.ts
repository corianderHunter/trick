import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ebook } from '../entities/ebook.entity';
import { EbookChapter } from '../entities/ebook-chapter.entity';
import { EbookController } from './ebook.controller';
import { EbookService } from './ebook.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ebook, EbookChapter])],
  controllers: [EbookController],
  providers: [EbookService],
  exports: [EbookService],
})
export class EbookModule {}

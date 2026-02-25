import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AiModule } from './ai/ai.module';
import { ModelConfig } from './entities/model-config.entity';
import { GenerationTask } from './entities/generation-task.entity';
import { DialogueStyle } from './entities/dialogue-style.entity';
import { VisualStyle } from './entities/visual-style.entity';
import { Ebook } from './entities/ebook.entity';
import { EbookChapter } from './entities/ebook-chapter.entity';
import { Project } from './entities/project.entity';
import { ProjectTask } from './entities/project-task.entity';
import { ModelConfigModule } from './model-config/model-config.module';
import { EbookModule } from './ebook/ebook.module';
import { GenerationModule } from './generation/generation.module';
import { DialogueStyleModule } from './dialogue-style/dialogue-style.module';
import { VisualStyleModule } from './visual-style/visual-style.module';
import { ProjectModule } from './project/project.module';
import { ProjectTaskModule } from './project-task/project-task.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AiModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      username: process.env.DB_USERNAME ?? 'admin',
      password: process.env.DB_PASSWORD ?? 'admin',
      database: process.env.DB_NAME ?? 'trick',
      entities: [
        ModelConfig,
        GenerationTask,
        DialogueStyle,
        VisualStyle,
        Ebook,
        EbookChapter,
        Project,
        ProjectTask,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    ModelConfigModule,
    GenerationModule,
    DialogueStyleModule,
    VisualStyleModule,
    EbookModule,
    ProjectModule,
    ProjectTaskModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

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
import { ModelConfigModule } from './model-config/model-config.module';
import { GenerationModule } from './generation/generation.module';
import { DialogueStyleModule } from './dialogue-style/dialogue-style.module';
import { VisualStyleModule } from './visual-style/visual-style.module';

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
      entities: [ModelConfig, GenerationTask, DialogueStyle, VisualStyle],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
    ModelConfigModule,
    GenerationModule,
    DialogueStyleModule,
    VisualStyleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

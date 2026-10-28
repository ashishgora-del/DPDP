import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TemplateGenerationController } from './template-generation.controller';
import { TemplateGenerationService } from './template-generation.service';
import { ConversationService } from './conversation.service';
import { GenAIService } from './genai.service';
import { AIClientService } from './ai-client.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  controllers: [TemplateGenerationController],
  providers: [TemplateGenerationService, ConversationService, GenAIService, AIClientService],
  exports: [TemplateGenerationService, ConversationService],
})
export class TemplateGenerationModule {}

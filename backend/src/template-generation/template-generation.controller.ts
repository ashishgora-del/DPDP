import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TemplateGenerationService } from './template-generation.service';
import { ConversationService } from './conversation.service';
import {
  GenerateFromTemplateDto,
  GenerateCustomDto,
  UpdateDocumentDto,
  ListArtifactsDto,
  StartConversationDto,
  SubmitAnswerDto,
  SubmitMessageDto,
  JumpToSectionDto,
} from './dto';

@ApiTags('Template Generation')
@Controller('template-generation')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TemplateGenerationController {
  constructor(
    private readonly templateService: TemplateGenerationService,
    private readonly conversationService: ConversationService,
  ) {}

  @Get('artifacts')
  @SkipThrottle() // Read-only endpoint, no throttle needed
  @ApiOperation({ summary: 'List available document templates' })
  @ApiResponse({ status: 200, description: 'List of artifacts returned successfully' })
  async listArtifacts(@Query() filters: ListArtifactsDto) {
    return this.templateService.listArtifacts(filters);
  }

  @Get('artifacts/:id')
  @SkipThrottle() // Read-only endpoint, no throttle needed
  @ApiOperation({ summary: 'Get artifact details by ID' })
  @ApiResponse({ status: 200, description: 'Artifact details returned successfully' })
  @ApiResponse({ status: 404, description: 'Artifact not found' })
  async getArtifact(@Param('id') id: string) {
    return this.templateService.getArtifact(id);
  }

  @Post('generate/template')
  @ApiOperation({ summary: 'Generate document from template using AI' })
  @ApiResponse({ status: 201, description: 'Document generated successfully' })
  @ApiResponse({ status: 404, description: 'Artifact not found' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generateFromTemplate(
    @CurrentUser() user: any,
    @Body() dto: GenerateFromTemplateDto,
  ) {
    return this.templateService.generateFromTemplate(user.sub, dto);
  }

  @Post('generate/custom')
  @ApiOperation({ summary: 'Generate custom document from prompt using AI' })
  @ApiResponse({ status: 201, description: 'Custom document generated successfully' })
  @ApiResponse({ status: 500, description: 'AI generation failed' })
  async generateCustomDocument(
    @CurrentUser() user: any,
    @Body() dto: GenerateCustomDto,
  ) {
    return this.templateService.generateCustomDocument(user.sub, dto);
  }

  @Get('documents')
  @SkipThrottle() // Frequently polled endpoint, no throttle needed
  @ApiOperation({ summary: 'Get all generated documents for current user' })
  @ApiResponse({ status: 200, description: 'Documents list returned successfully' })
  async getUserDocuments(
    @CurrentUser() user: any,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('assessmentId') assessmentId?: string,
  ) {
    return this.templateService.getUserDocuments(user.sub, page, limit, assessmentId);
  }

  @Get('documents/:id')
  @SkipThrottle() // Read-only endpoint, no throttle needed
  @ApiOperation({ summary: 'Get generated document by ID' })
  @ApiResponse({ status: 200, description: 'Document returned successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.templateService.getDocument(id, user.sub);
  }

  @Patch('documents/:id')
  @ApiOperation({ summary: 'Update generated document' })
  @ApiResponse({ status: 200, description: 'Document updated successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async updateDocument(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.templateService.updateDocument(id, user.sub, dto);
  }

  @Delete('documents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete generated document' })
  @ApiResponse({ status: 204, description: 'Document deleted successfully' })
  @ApiResponse({ status: 404, description: 'Document not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async deleteDocument(@CurrentUser() user: any, @Param('id') id: string) {
    await this.templateService.deleteDocument(id, user.sub);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // AI-Assisted Conversation Endpoints
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('documents/:documentId/start-ai-conversation')
  @ApiOperation({ summary: 'Start AI-assisted conversation for a document' })
  @ApiResponse({ status: 201, description: 'Conversation started successfully' })
  @ApiResponse({ status: 404, description: 'Document or template not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async startConversation(
    @CurrentUser() user: any,
    @Param('documentId') documentId: string,
    @Body() dto: StartConversationDto,
  ) {
    return this.conversationService.startConversation(user.sub, documentId, dto);
  }

  @Post('conversations/:conversationId/answer')
  @ApiOperation({ summary: 'Submit an answer in the conversation (legacy single-field mode)' })
  @ApiResponse({ status: 200, description: 'Answer submitted successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 400, description: 'Invalid answer or field' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async submitAnswer(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.conversationService.submitAnswer(conversationId, user.sub, dto);
  }

  @Post('conversations/:conversationId/message')
  @ApiOperation({ summary: 'Submit a free-text message in the conversation (grouped/conversational mode)' })
  @ApiResponse({ status: 200, description: 'Message processed successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async submitMessage(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: SubmitMessageDto,
  ) {
    return this.conversationService.submitMessage(conversationId, user.sub, dto.message);
  }

  @Patch('conversations/:conversationId/jump-to-section')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Jump to a specific section (edit / re-fill). Keeps existing answers as defaults.' })
  @ApiResponse({ status: 200, description: 'Jumped to section successfully' })
  @ApiResponse({ status: 404, description: 'Conversation or section not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async jumpToSection(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
    @Body() dto: JumpToSectionDto,
  ) {
    return this.conversationService.jumpToSection(conversationId, user.sub, dto.sectionId);
  }

  @Get('conversations/:conversationId')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get conversation state (resume capability)' })
  @ApiResponse({ status: 200, description: 'Conversation state returned successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getConversationState(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationService.getConversationState(conversationId, user.sub);
  }

  @Post('conversations/:conversationId/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause an active conversation' })
  @ApiResponse({ status: 200, description: 'Conversation paused successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async pauseConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    await this.conversationService.pauseConversation(conversationId, user.sub);
    return { success: true, message: 'Conversation paused successfully' };
  }

  @Post('conversations/:conversationId/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused conversation' })
  @ApiResponse({ status: 200, description: 'Conversation resumed successfully' })
  @ApiResponse({ status: 404, description: 'Conversation not found' })
  @ApiResponse({ status: 400, description: 'Conversation already completed' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async resumeConversation(
    @CurrentUser() user: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversationService.resumeConversation(conversationId, user.sub);
  }

  @Get('templates/:templateId/structure')
  @SkipThrottle()
  @ApiOperation({ summary: 'Get template structure for UI rendering' })
  @ApiResponse({ status: 200, description: 'Template structure returned successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplateStructure(@Param('templateId') templateId: string) {
    // This will be used by frontend to render the template
    const result = await this.conversationService['getTemplate'](templateId);
    return {
      templateId: result.id,
      name: result.name,
      version: result.version,
      description: result.description,
      sections: result.structure.sections.map(s => ({
        sectionId: s.sectionId,
        sectionNumber: s.sectionNumber,
        title: s.title,
        emoji: s.emoji,
        description: s.description,
        estimatedTime: s.estimatedTime,
        fieldCount: s.fields?.length || 0,
      })),
      totalFields: result.structure.sections.reduce((sum, s) => sum + (s.fields?.length || 0), 0),
      estimatedTime: result.structure.metadata?.totalEstimatedTime,
    };
  }
}


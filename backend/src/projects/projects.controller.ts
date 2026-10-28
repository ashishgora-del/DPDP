import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, SaveSelectionsDto, SaveChecklistDto, UploadAttachmentDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  async create(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    return this.service.createProject(user.sub, dto);
  }

  @Get()
  @SkipThrottle() // Frequently polled endpoint
  @ApiOperation({ summary: 'Get all projects for current user (with progress)' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  async getAll(@CurrentUser() user: any) {
    return this.service.getUserProjects(user.sub);
  }

  @Get(':id')
  @SkipThrottle() // Read-only endpoint
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404 })
  async getOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getProject(id, user.sub);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200 })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.deleteProject(id, user.sub);
  }

  @Get(':id/selections')
  @SkipThrottle() // Read-only endpoint
  @ApiOperation({ summary: 'Get saved artifact selections for a project' })
  @ApiResponse({ status: 200, description: 'Array of { artifactId, selected }' })
  async getSelections(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getSelections(id, user.sub);
  }

  @Put(':id/selections')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save artifact selections for a project (upsert)' })
  @ApiResponse({ status: 200 })
  async saveSelections(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SaveSelectionsDto,
  ) {
    return this.service.upsertSelections(id, user.sub, dto.selections);
  }

  @Get(':id/checklist')
  @SkipThrottle() // Read-only endpoint
  @ApiOperation({ summary: 'Get compliance checklist state for a project' })
  @ApiResponse({ status: 200, description: 'Array of { itemId, checked }' })
  async getChecklist(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.getChecklist(id, user.sub);
  }

  @Put(':id/checklist')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save compliance checklist state for a project (upsert)' })
  @ApiResponse({ status: 200 })
  async saveChecklist(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SaveChecklistDto,
  ) {
    return this.service.upsertChecklist(id, user.sub, dto.items);
  }

  @Get(':id/compliance-eligibility')
  @SkipThrottle() // Read-only endpoint
  @ApiOperation({ summary: 'Check if project is eligible for compliance tracking' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns eligibility status, requirements check, and reason if not eligible' 
  })
  async checkComplianceEligibility(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.service.checkComplianceEligibility(id, user.sub);
  }

  @Post(':id/compliance/attachments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload an attachment for a compliance checklist item' })
  @ApiResponse({ status: 201, description: 'Attachment uploaded successfully' })
  async uploadAttachment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UploadAttachmentDto,
  ) {
    return this.service.uploadAttachment(id, user.sub, dto);
  }

  @Get(':id/compliance/attachments')
  @SkipThrottle() // Read-only endpoint
  @ApiOperation({ summary: 'Get attachments for a project (optionally filtered by checklist item)' })
  @ApiResponse({ status: 200, description: 'List of attachments' })
  async getAttachments(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Query('itemId') itemId?: string,
  ) {
    return this.service.getAttachments(id, user.sub, itemId);
  }

  @Delete(':id/compliance/attachments/:attachmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an attachment' })
  @ApiResponse({ status: 200, description: 'Attachment deleted' })
  async deleteAttachment(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
  ) {
    return this.service.deleteAttachment(id, user.sub, attachmentId);
  }
}

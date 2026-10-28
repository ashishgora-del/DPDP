import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RiskAssessmentService } from './risk-assessment.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { AssessmentResponseDto } from './dto/assessment-response.dto';

@ApiTags('Risk Assessment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('risk-assessment')
export class RiskAssessmentController {
  constructor(private readonly service: RiskAssessmentService) {}

  @Post('submit')
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 submissions per minute
  @ApiOperation({ summary: 'Submit risk assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully', type: AssessmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async submitAssessment(
    @CurrentUser() user: any,
    @Body() dto: SubmitAssessmentDto
  ) {
    return this.service.createAssessment(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiResponse({ status: 200, description: 'Assessment found', type: AssessmentResponseDto })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getAssessment(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.service.getAssessment(id, user.sub, user.isSuperAdmin);
  }

  @Get('user/me')
  @ApiOperation({ summary: 'Get all assessments for current user' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of assessments' })
  async getUserAssessments(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    return this.service.getUserAssessments(user.sub, page, limit);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete assessment' })
  @ApiResponse({ status: 200, description: 'Assessment deleted successfully' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async deleteAssessment(
    @CurrentUser() user: any,
    @Param('id') id: string
  ) {
    return this.service.deleteAssessment(id, user.sub, user.isSuperAdmin);
  }
}

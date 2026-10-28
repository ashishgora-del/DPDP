import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateModuleProgressDto } from './dto/update-module-progress.dto';

@ApiTags('learning')
@Controller('learning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningController {
  constructor(private learningService: LearningService) {}

  // ==================== ENROLLMENTS ====================
  @Post('enrollments')
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiResponse({ status: 201, description: 'Successfully enrolled' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({ status: 409, description: 'Already enrolled' })
  async createEnrollment(@Request() req, @Body() dto: CreateEnrollmentDto) {
    return this.learningService.createEnrollment(req.user.sub, dto);
  }

  @Get('enrollments')
  @ApiOperation({ summary: 'Get user enrollments' })
  @ApiResponse({ status: 200, description: 'List of enrollments' })
  async getEnrollments(@Request() req) {
    return this.learningService.getUserEnrollments(req.user.sub);
  }

  // ==================== PROGRESS ====================
  @Get('progress/module/:moduleId')
  @ApiOperation({ summary: 'Get module progress' })
  @ApiResponse({ status: 200, description: 'Module progress' })
  async getModuleProgress(@Request() req, @Param('moduleId') moduleId: string) {
    return this.learningService.getModuleProgress(req.user.sub, moduleId);
  }

  @Post('progress/module/:moduleId')
  @ApiOperation({ summary: 'Update module progress' })
  @ApiResponse({ status: 200, description: 'Progress updated' })
  async updateModuleProgress(
    @Request() req,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateModuleProgressDto,
  ) {
    return this.learningService.updateModuleProgress(req.user.sub, moduleId, dto);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get user progress across all courses' })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiResponse({ status: 200, description: 'User progress' })
  async getUserProgress(@Request() req, @Query('courseId') courseId?: string) {
    return this.learningService.getUserProgress(req.user.sub, courseId);
  }

  // ==================== DASHBOARD ====================
  @Get('dashboard')
  @ApiOperation({ summary: 'Get My Learning dashboard' })
  @ApiResponse({ status: 200, description: 'Dashboard data' })
  async getDashboard(@Request() req) {
    return this.learningService.getMyLearningDashboard(req.user.sub);
  }
}

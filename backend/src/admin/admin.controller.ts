import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateDomainDto, UpdateDomainDto } from './dto/domain.dto';
import { CreatePathDto, UpdatePathDto } from './dto/path.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
import { CreateContentBlockDto } from './dto/content-block.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  // ==================== DOMAINS ====================
  @Post('domains')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create domain (Admin only)' })
  @ApiResponse({ status: 201, description: 'Domain created' })
  async createDomain(@Body() dto: CreateDomainDto) {
    return this.adminService.createDomain(dto);
  }

  @Patch('domains/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update domain (Admin only)' })
  @ApiResponse({ status: 200, description: 'Domain updated' })
  async updateDomain(@Param('id') id: string, @Body() dto: UpdateDomainDto) {
    return this.adminService.updateDomain(id, dto);
  }

  @Delete('domains/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete domain (Admin only)' })
  @ApiResponse({ status: 200, description: 'Domain deleted' })
  async deleteDomain(@Param('id') id: string) {
    return this.adminService.deleteDomain(id);
  }

  // ==================== LEARNING PATHS ====================
  @Get('paths')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Get all paths (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'List of paths' })
  async getPaths() {
    return this.adminService.getAllPathsAdmin();
  }

  @Post('paths')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Create learning path (Admin/Author)' })
  @ApiResponse({ status: 201, description: 'Path created' })
  async createPath(@Request() req, @Body() dto: CreatePathDto) {
    return this.adminService.createPath(req.user.sub, dto);
  }

  @Patch('paths/:id')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Update learning path (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Path updated' })
  async updatePath(@Param('id') id: string, @Body() dto: UpdatePathDto) {
    return this.adminService.updatePath(id, dto);
  }

  @Delete('paths/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete learning path (Admin only)' })
  @ApiResponse({ status: 200, description: 'Path deleted' })
  async deletePath(@Param('id') id: string) {
    return this.adminService.deletePath(id);
  }

  // ==================== COURSES ====================
  @Get('courses')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Get all courses (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async getCourses(@Query('pathId') pathId?: string) {
    return this.adminService.getAllCoursesAdmin(pathId);
  }

  @Post('courses')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Create course (Admin/Author)' })
  @ApiResponse({ status: 201, description: 'Course created' })
  async createCourse(@Request() req, @Body() dto: CreateCourseDto) {
    return this.adminService.createCourse(req.user.sub, dto);
  }

  @Patch('courses/:id')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Update course (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Course updated' })
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.adminService.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course deleted' })
  async deleteCourse(@Param('id') id: string) {
    return this.adminService.deleteCourse(id);
  }

  // ==================== MODULES ====================
  @Get('modules')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Get all modules (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'List of modules' })
  async getModules(@Query('courseId') courseId?: string) {
    return this.adminService.getAllModulesAdmin(courseId);
  }

  @Post('modules')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Create module (Admin/Author)' })
  @ApiResponse({ status: 201, description: 'Module created' })
  async createModule(@Request() req, @Body() dto: CreateModuleDto) {
    return this.adminService.createModule(req.user.sub, dto);
  }

  @Patch('modules/:id')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Update module (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Module updated' })
  async updateModule(@Param('id') id: string, @Body() dto: UpdateModuleDto) {
    return this.adminService.updateModule(id, dto);
  }

  @Patch('modules/:id/publish')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Publish module (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Module published' })
  async publishModule(@Param('id') id: string) {
    return this.adminService.publishModule(id);
  }

  @Patch('modules/:id/unpublish')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Unpublish module (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Module unpublished' })
  async unpublishModule(@Param('id') id: string) {
    return this.adminService.unpublishModule(id);
  }

  @Delete('modules/:id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete module (Admin only)' })
  @ApiResponse({ status: 200, description: 'Module deleted' })
  async deleteModule(@Param('id') id: string) {
    return this.adminService.deleteModule(id);
  }

  // ==================== CONTENT BLOCKS ====================
  @Post('content-blocks')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Create content block (Admin/Author)' })
  @ApiResponse({ status: 201, description: 'Content block created' })
  async createContentBlock(@Body() dto: CreateContentBlockDto) {
    return this.adminService.createContentBlock(dto);
  }

  @Patch('content-blocks/:id')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Update content block (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Content block updated' })
  async updateContentBlock(@Param('id') id: string, @Body() dto: Partial<CreateContentBlockDto>) {
    return this.adminService.updateContentBlock(id, dto);
  }

  @Delete('content-blocks/:id')
  @Roles('ADMIN', 'AUTHOR')
  @ApiOperation({ summary: 'Delete content block (Admin/Author)' })
  @ApiResponse({ status: 200, description: 'Content block deleted' })
  async deleteContentBlock(@Param('id') id: string) {
    return this.adminService.deleteContentBlock(id);
  }
}

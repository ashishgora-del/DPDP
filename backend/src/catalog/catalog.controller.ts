import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private catalogService: CatalogService) {}

  // ==================== DOMAINS ====================
  @Get('domains')
  @ApiOperation({ summary: 'Get all domains' })
  @ApiResponse({ status: 200, description: 'List of domains' })
  async getDomains() {
    return this.catalogService.getAllDomains();
  }

  @Get('domains/:slug')
  @ApiOperation({ summary: 'Get domain by slug' })
  @ApiResponse({ status: 200, description: 'Domain details' })
  @ApiResponse({ status: 404, description: 'Domain not found' })
  async getDomainBySlug(@Param('slug') slug: string) {
    return this.catalogService.getDomainBySlug(slug);
  }

  // ==================== LEARNING PATHS ====================
  @Get('paths')
  @ApiOperation({ summary: 'Get all learning paths' })
  @ApiQuery({ name: 'role', required: false, enum: ['BEGINNER', 'DEVELOPER', 'MANAGER', 'LEADER', 'PRACTITIONER', 'GRC'] })
  @ApiQuery({ name: 'domainId', required: false })
  @ApiResponse({ status: 200, description: 'List of learning paths' })
  async getPaths(@Query('role') role?: string, @Query('domainId') domainId?: string) {
    return this.catalogService.getAllPaths({ role, domainId });
  }

  @Get('paths/:slug')
  @ApiOperation({ summary: 'Get learning path by slug' })
  @ApiResponse({ status: 200, description: 'Learning path details' })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async getPathBySlug(@Param('slug') slug: string) {
    return this.catalogService.getPathBySlug(slug);
  }

  // ==================== COURSES ====================
  @Get('courses')
  @ApiOperation({ summary: 'Get all published courses' })
  @ApiQuery({ name: 'isPublished', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of courses' })
  async getCourses(
    @Query('isPublished') isPublished?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.catalogService.getAllCourses({
      isPublished: isPublished === 'true',
      search,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 12,
    });
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiResponse({ status: 200, description: 'Course details' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourse(@Param('id') id: string) {
    return this.catalogService.getCourseById(id);
  }

  // ==================== MODULES ====================
  @Get('modules/:id')
  @ApiOperation({ summary: 'Get module by ID (requires auth for paid modules)' })
  @ApiResponse({ status: 200, description: 'Module details' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModule(@Param('id') id: string, @Request() req) {
    const userId = req.user?.sub;
    return this.catalogService.getModuleById(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('modules/:id/content')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get module content (authenticated)' })
  @ApiResponse({ status: 200, description: 'Module content' })
  @ApiResponse({ status: 403, description: 'Access denied - purchase required' })
  @ApiResponse({ status: 404, description: 'Module not found' })
  async getModuleContent(@Param('id') id: string, @Request() req) {
    return this.catalogService.getModuleContent(id, req.user.sub);
  }
}

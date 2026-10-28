import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DatabaseService } from '../database/database.service';
import { CreateDomainDto, UpdateDomainDto } from './dto/domain.dto';
import { CreatePathDto, UpdatePathDto } from './dto/path.dto';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';
import { CreateContentBlockDto } from './dto/content-block.dto';
import { 
  Domain, 
  LearningPath, 
  Course, 
  Module, 
  ContentBlock 
} from '../database/database.types';

@Injectable()
export class AdminService {
  constructor(private db: DatabaseService) {}

  // ==================== DOMAINS ====================
  async createDomain(dto: CreateDomainDto): Promise<Domain> {
    const id = randomUUID();
    const result = await this.db.query<Domain>(
      `INSERT INTO domains (id, name, slug, description, icon)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, dto.name, dto.slug, dto.description, dto.icon]
    );
    return result.rows[0];
  }

  async updateDomain(id: string, dto: UpdateDomainDto): Promise<Domain> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(dto.slug);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.icon !== undefined) {
      fields.push(`icon = $${paramIndex++}`);
      values.push(dto.icon);
    }

    if (fields.length === 0) {
      const result = await this.db.query<Domain>('SELECT * FROM domains WHERE id = $1', [id]);
      if (result.rows.length === 0) throw new NotFoundException('Domain not found');
      return result.rows[0];
    }

    values.push(id);
    const result = await this.db.query<Domain>(
      `UPDATE domains SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new NotFoundException('Domain not found');
    return result.rows[0];
  }

  async deleteDomain(id: string): Promise<Domain> {
    const result = await this.db.query<Domain>(
      'DELETE FROM domains WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Domain not found');
    return result.rows[0];
  }

  // ==================== LEARNING PATHS ====================
  async createPath(userId: string, dto: CreatePathDto): Promise<LearningPath & { domain?: Domain }> {
    const id = randomUUID();
    const result = await this.db.query<LearningPath>(
      `INSERT INTO learning_paths (id, name, slug, description, domain_id, order_index, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, dto.name, dto.slug, dto.description, dto.domainId, dto.orderIndex, userId]
    );

    const path = result.rows[0];

    // Include domain
    const domainResult = await this.db.query<Domain>(
      'SELECT * FROM domains WHERE id = $1',
      [path.domain_id]
    );

    return {
      ...path,
      domain: domainResult.rows[0] || undefined
    };
  }

  async updatePath(id: string, dto: UpdatePathDto): Promise<LearningPath & { domain?: Domain }> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(dto.slug);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.domainId !== undefined) {
      fields.push(`domain_id = $${paramIndex++}`);
      values.push(dto.domainId);
    }
    if (dto.orderIndex !== undefined) {
      fields.push(`order_index = $${paramIndex++}`);
      values.push(dto.orderIndex);
    }

    if (fields.length === 0) {
      const result = await this.db.query<LearningPath>('SELECT * FROM learning_paths WHERE id = $1', [id]);
      if (result.rows.length === 0) throw new NotFoundException('Learning path not found');
      
      const path = result.rows[0];
      const domainResult = await this.db.query<Domain>('SELECT * FROM domains WHERE id = $1', [path.domain_id]);
      return { ...path, domain: domainResult.rows[0] || undefined };
    }

    values.push(id);
    const result = await this.db.query<LearningPath>(
      `UPDATE learning_paths SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new NotFoundException('Learning path not found');
    
    const path = result.rows[0];
    const domainResult = await this.db.query<Domain>('SELECT * FROM domains WHERE id = $1', [path.domain_id]);
    
    return {
      ...path,
      domain: domainResult.rows[0] || undefined
    };
  }

  async deletePath(id: string): Promise<LearningPath> {
    const result = await this.db.query<LearningPath>(
      'DELETE FROM learning_paths WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Learning path not found');
    return result.rows[0];
  }

  async getAllPathsAdmin(): Promise<Array<LearningPath & { domain?: Domain; courses?: Course[] }>> {
    const result = await this.db.query<LearningPath & { domain?: Domain; courses?: Course[] }>(
      `SELECT 
         lp.*,
         json_build_object(
           'id', d.id,
           'name', d.name,
           'slug', d.slug,
           'description', d.description,
           'icon', d.icon,
           'created_at', d.created_at,
           'updated_at', d.updated_at
         ) as domain,
         COALESCE(
           json_agg(
             json_build_object(
               'id', c.id,
               'name', c.name,
               'slug', c.slug,
               'description', c.description,
               'path_id', c.path_id,
               'order_index', c.order_index,
               'estimated_duration', c.estimated_duration,
               'level', c.level,
               'created_by', c.created_by,
               'created_at', c.created_at,
               'updated_at', c.updated_at
             ) ORDER BY c.order_index
           ) FILTER (WHERE c.id IS NOT NULL),
           '[]'
         ) as courses
       FROM learning_paths lp
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN courses c ON c.path_id = lp.id
       GROUP BY lp.id, d.id
       ORDER BY lp.created_at DESC`,
      []
    );

    return result.rows;
  }

  // ==================== COURSES ====================
  async createCourse(userId: string, dto: CreateCourseDto): Promise<Course & { path?: LearningPath }> {
    const id = randomUUID();
    const result = await this.db.query<Course>(
      `INSERT INTO courses (id, name, slug, description, path_id, order_index, estimated_duration, level, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [id, dto.name, dto.slug, dto.description, dto.pathId, dto.orderIndex, dto.estimatedDuration, dto.level, userId]
    );

    const course = result.rows[0];

    // Include path
    const pathResult = await this.db.query<LearningPath>(
      'SELECT * FROM learning_paths WHERE id = $1',
      [course.path_id]
    );

    return {
      ...course,
      path: pathResult.rows[0] || undefined
    };
  }

  async updateCourse(id: string, dto: UpdateCourseDto): Promise<Course & { path?: LearningPath }> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(dto.name);
    }
    if (dto.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(dto.slug);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.pathId !== undefined) {
      fields.push(`path_id = $${paramIndex++}`);
      values.push(dto.pathId);
    }
    if (dto.orderIndex !== undefined) {
      fields.push(`order_index = $${paramIndex++}`);
      values.push(dto.orderIndex);
    }
    if (dto.estimatedDuration !== undefined) {
      fields.push(`estimated_duration = $${paramIndex++}`);
      values.push(dto.estimatedDuration);
    }
    if (dto.level !== undefined) {
      fields.push(`level = $${paramIndex++}`);
      values.push(dto.level);
    }

    if (fields.length === 0) {
      const result = await this.db.query<Course>('SELECT * FROM courses WHERE id = $1', [id]);
      if (result.rows.length === 0) throw new NotFoundException('Course not found');
      
      const course = result.rows[0];
      const pathResult = await this.db.query<LearningPath>('SELECT * FROM learning_paths WHERE id = $1', [course.path_id]);
      return { ...course, path: pathResult.rows[0] || undefined };
    }

    values.push(id);
    const result = await this.db.query<Course>(
      `UPDATE courses SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new NotFoundException('Course not found');
    
    const course = result.rows[0];
    const pathResult = await this.db.query<LearningPath>('SELECT * FROM learning_paths WHERE id = $1', [course.path_id]);
    
    return {
      ...course,
      path: pathResult.rows[0] || undefined
    };
  }

  async deleteCourse(id: string): Promise<Course> {
    const result = await this.db.query<Course>(
      'DELETE FROM courses WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Course not found');
    return result.rows[0];
  }

  async getAllCoursesAdmin(pathId?: string): Promise<Array<Course & { path?: LearningPath & { domain?: Domain }; modules?: Module[] }>> {
    const whereClause = pathId ? 'WHERE c.path_id = $1' : '';
    const params = pathId ? [pathId] : [];

    const result = await this.db.query<Course & { path?: LearningPath & { domain?: Domain }; modules?: Module[] }>(
      `SELECT 
         c.*,
         json_build_object(
           'id', lp.id,
           'name', lp.name,
           'slug', lp.slug,
           'description', lp.description,
           'domain_id', lp.domain_id,
           'order_index', lp.order_index,
           'created_by', lp.created_by,
           'created_at', lp.created_at,
           'updated_at', lp.updated_at,
           'domain', json_build_object(
             'id', d.id,
             'name', d.name,
             'slug', d.slug,
             'description', d.description,
             'icon', d.icon,
             'created_at', d.created_at,
             'updated_at', d.updated_at
           )
         ) as path,
         COALESCE(
           json_agg(
             json_build_object(
               'id', m.id,
               'title', m.title,
               'slug', m.slug,
               'description', m.description,
               'course_id', m.course_id,
               'order_index', m.order_index,
               'estimated_duration', m.estimated_duration,
               'is_free', m.is_free,
               'is_published', m.is_published,
               'created_by', m.created_by,
               'created_at', m.created_at,
               'updated_at', m.updated_at
             ) ORDER BY m.order_index
           ) FILTER (WHERE m.id IS NOT NULL),
           '[]'
         ) as modules
       FROM courses c
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN modules m ON m.course_id = c.id
       ${whereClause}
       GROUP BY c.id, lp.id, d.id
       ORDER BY c.path_id, c.order_index`,
      params
    );

    return result.rows;
  }

  // ==================== MODULES ====================
  async createModule(userId: string, dto: CreateModuleDto): Promise<Module & { course?: Course }> {
    // Enforce business rule: first module must be free
    const countResult = await this.db.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM modules WHERE course_id = $1',
      [dto.courseId]
    );

    const moduleCount = parseInt(countResult.rows[0].count, 10);
    const isFree = dto.orderIndex === 0 || moduleCount === 0 ? true : dto.isFree;

    const id = randomUUID();
    const result = await this.db.query<Module>(
      `INSERT INTO modules (id, title, slug, description, course_id, order_index, estimated_duration, is_free, is_published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [id, dto.title, dto.slug, dto.description, dto.courseId, dto.orderIndex, dto.estimatedDuration, isFree, dto.isPublished ?? false, userId]
    );

    const module = result.rows[0];

    // Include course
    const courseResult = await this.db.query<Course>(
      'SELECT * FROM courses WHERE id = $1',
      [module.course_id]
    );

    return {
      ...module,
      course: courseResult.rows[0] || undefined
    };
  }

  async updateModule(id: string, dto: UpdateModuleDto): Promise<Module & { course?: Course }> {
    // Check if module exists and get order_index
    const moduleResult = await this.db.query<Module>(
      'SELECT * FROM modules WHERE id = $1',
      [id]
    );

    if (moduleResult.rows.length === 0) {
      throw new NotFoundException('Module not found');
    }

    const module = moduleResult.rows[0];

    // Enforce business rule: first module must be free
    if (module.order_index === 0 && dto.isFree === false) {
      throw new ForbiddenException('First module of a course must be free');
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(dto.title);
    }
    if (dto.slug !== undefined) {
      fields.push(`slug = $${paramIndex++}`);
      values.push(dto.slug);
    }
    if (dto.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(dto.description);
    }
    if (dto.courseId !== undefined) {
      fields.push(`course_id = $${paramIndex++}`);
      values.push(dto.courseId);
    }
    if (dto.orderIndex !== undefined) {
      fields.push(`order_index = $${paramIndex++}`);
      values.push(dto.orderIndex);
    }
    if (dto.estimatedDuration !== undefined) {
      fields.push(`estimated_duration = $${paramIndex++}`);
      values.push(dto.estimatedDuration);
    }
    if (dto.isFree !== undefined) {
      fields.push(`is_free = $${paramIndex++}`);
      values.push(dto.isFree);
    }
    if (dto.isPublished !== undefined) {
      fields.push(`is_published = $${paramIndex++}`);
      values.push(dto.isPublished);
    }

    if (fields.length === 0) {
      const courseResult = await this.db.query<Course>('SELECT * FROM courses WHERE id = $1', [module.course_id]);
      return { ...module, course: courseResult.rows[0] || undefined };
    }

    values.push(id);
    const result = await this.db.query<Module>(
      `UPDATE modules SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    const updatedModule = result.rows[0];
    const courseResult = await this.db.query<Course>('SELECT * FROM courses WHERE id = $1', [updatedModule.course_id]);
    
    return {
      ...updatedModule,
      course: courseResult.rows[0] || undefined
    };
  }

  async publishModule(id: string): Promise<Module> {
    const result = await this.db.query<Module>(
      'UPDATE modules SET is_published = true, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Module not found');
    return result.rows[0];
  }

  async unpublishModule(id: string): Promise<Module> {
    const result = await this.db.query<Module>(
      'UPDATE modules SET is_published = false, updated_at = NOW() WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Module not found');
    return result.rows[0];
  }

  async deleteModule(id: string): Promise<Module> {
    const result = await this.db.query<Module>(
      'DELETE FROM modules WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Module not found');
    return result.rows[0];
  }

  async getAllModulesAdmin(courseId?: string): Promise<Array<Module & { course?: Course & { path?: LearningPath }; contentBlocks?: ContentBlock[] }>> {
    const whereClause = courseId ? 'WHERE m.course_id = $1' : '';
    const params = courseId ? [courseId] : [];

    const result = await this.db.query<Module & { course?: Course & { path?: LearningPath }; contentBlocks?: ContentBlock[] }>(
      `SELECT 
         m.*,
         json_build_object(
           'id', c.id,
           'name', c.name,
           'slug', c.slug,
           'description', c.description,
           'path_id', c.path_id,
           'order_index', c.order_index,
           'estimated_duration', c.estimated_duration,
           'level', c.level,
           'created_by', c.created_by,
           'created_at', c.created_at,
           'updated_at', c.updated_at,
           'path', json_build_object(
             'id', lp.id,
             'name', lp.name,
             'slug', lp.slug,
             'description', lp.description,
             'domain_id', lp.domain_id,
             'order_index', lp.order_index,
             'created_by', lp.created_by,
             'created_at', lp.created_at,
             'updated_at', lp.updated_at
           )
         ) as course,
         COALESCE(
           json_agg(
             json_build_object(
               'id', cb.id,
               'module_id', cb.module_id,
               'type', cb.type,
               'order_index', cb.order_index,
               'content', cb.content,
               'metadata', cb.metadata,
               'created_at', cb.created_at,
               'updated_at', cb.updated_at
             ) ORDER BY cb.order_index
           ) FILTER (WHERE cb.id IS NOT NULL),
           '[]'
         ) as content_blocks
       FROM modules m
       LEFT JOIN courses c ON c.id = m.course_id
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       LEFT JOIN content_blocks cb ON cb.module_id = m.id
       ${whereClause}
       GROUP BY m.id, c.id, lp.id
       ORDER BY m.course_id, m.order_index`,
      params
    );

    return result.rows;
  }

  // ==================== CONTENT BLOCKS ====================
  async createContentBlock(dto: CreateContentBlockDto): Promise<ContentBlock> {
    const id = randomUUID();
    const result = await this.db.query<ContentBlock>(
      `INSERT INTO content_blocks (id, module_id, type, order_index, content, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [id, dto.moduleId, dto.type, dto.orderIndex, dto.content, dto.metadata ? JSON.stringify(dto.metadata) : null]
    );
    return result.rows[0];
  }

  async updateContentBlock(id: string, dto: Partial<CreateContentBlockDto>): Promise<ContentBlock> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (dto.moduleId !== undefined) {
      fields.push(`module_id = $${paramIndex++}`);
      values.push(dto.moduleId);
    }
    if (dto.type !== undefined) {
      fields.push(`type = $${paramIndex++}`);
      values.push(dto.type);
    }
    if (dto.orderIndex !== undefined) {
      fields.push(`order_index = $${paramIndex++}`);
      values.push(dto.orderIndex);
    }
    if (dto.content !== undefined) {
      fields.push(`content = $${paramIndex++}`);
      values.push(dto.content);
    }
    if (dto.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex++}`);
      values.push(dto.metadata ? JSON.stringify(dto.metadata) : null);
    }

    if (fields.length === 0) {
      const result = await this.db.query<ContentBlock>('SELECT * FROM content_blocks WHERE id = $1', [id]);
      if (result.rows.length === 0) throw new NotFoundException('Content block not found');
      return result.rows[0];
    }

    values.push(id);
    const result = await this.db.query<ContentBlock>(
      `UPDATE content_blocks SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) throw new NotFoundException('Content block not found');
    return result.rows[0];
  }

  async deleteContentBlock(id: string): Promise<ContentBlock> {
    const result = await this.db.query<ContentBlock>(
      'DELETE FROM content_blocks WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundException('Content block not found');
    return result.rows[0];
  }
}

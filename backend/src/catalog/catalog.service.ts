import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class CatalogService {
  constructor(private db: DatabaseService) {}

  // ==================== DOMAINS ====================
  async getAllDomains() {
    const result = await this.db.query(
      'SELECT * FROM domains ORDER BY name ASC',
      []
    );
    return result.rows;
  }

  async getDomainBySlug(slug: string) {
    const result = await this.db.query(
      `SELECT 
        d.*,
        json_agg(
          json_build_object(
            'id', lp.id,
            'slug', lp.slug,
            'domainId', lp.domain_id,
            'title', lp.title,
            'description', lp.description,
            'targetRole', lp.target_role,
            'estimatedHours', lp.estimated_hours,
            'isPublic', lp.is_public,
            'createdBy', lp.created_by,
            'createdAt', lp.created_at,
            'updatedAt', lp.updated_at
          ) ORDER BY lp.created_at DESC
        ) FILTER (WHERE lp.id IS NOT NULL) as "learningPaths"
       FROM domains d
       LEFT JOIN learning_paths lp ON lp.domain_id = d.id AND lp.is_public = true
       WHERE d.slug = $1
       GROUP BY d.id`,
      [slug]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Domain not found');
    }

    return result.rows[0];
  }

  // ==================== LEARNING PATHS ====================
  async getAllPaths(filters?: { role?: string; domainId?: string }) {
    const conditions = ['lp.is_public = true'];
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.role) {
      conditions.push(`lp.target_role = $${paramCount++}`);
      params.push(filters.role);
    }

    if (filters?.domainId) {
      conditions.push(`lp.domain_id = $${paramCount++}`);
      params.push(filters.domainId);
    }

    const result = await this.db.query(
      `SELECT 
        lp.*,
        json_build_object(
          'id', d.id,
          'slug', d.slug,
          'name', d.name,
          'description', d.description
        ) as domain,
        json_agg(
          json_build_object(
            'id', c.id,
            'pathId', c.path_id,
            'title', c.title,
            'description', c.description,
            'level', c.level,
            'orderIndex', c.order_index,
            'isPublic', c.is_public,
            'createdAt', c.created_at,
            'modules', (
              SELECT json_agg(
                json_build_object(
                  'id', m.id,
                  'courseId', m.course_id,
                  'title', m.title,
                  'description', m.description,
                  'orderIndex', m.order_index,
                  'isFree', m.is_free,
                  'estimatedMinutes', m.estimated_minutes,
                  'isPublished', m.is_published,
                  'createdAt', m.created_at
                ) ORDER BY m.order_index
              )
              FROM modules m
              WHERE m.course_id = c.id AND m.is_published = true
            )
          ) ORDER BY c.order_index
        ) FILTER (WHERE c.id IS NOT NULL) as courses
       FROM learning_paths lp
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN courses c ON c.path_id = lp.id AND c.is_public = true
       WHERE ${conditions.join(' AND ')}
       GROUP BY lp.id, d.id
       ORDER BY lp.created_at DESC`,
      params
    );

    return result.rows;
  }

  async getPathBySlug(slug: string) {
    const result = await this.db.query(
      `SELECT 
        lp.*,
        json_build_object(
          'id', d.id,
          'slug', d.slug,
          'name', d.name,
          'description', d.description
        ) as domain,
        json_agg(
          json_build_object(
            'id', c.id,
            'pathId', c.path_id,
            'title', c.title,
            'description', c.description,
            'level', c.level,
            'orderIndex', c.order_index,
            'isPublic', c.is_public,
            'createdAt', c.created_at,
            'modules', (
              SELECT json_agg(
                json_build_object(
                  'id', m.id,
                  'courseId', m.course_id,
                  'title', m.title,
                  'description', m.description,
                  'orderIndex', m.order_index,
                  'isFree', m.is_free,
                  'estimatedMinutes', m.estimated_minutes,
                  'isPublished', m.is_published,
                  'createdAt', m.created_at
                ) ORDER BY m.order_index
              )
              FROM modules m
              WHERE m.course_id = c.id AND m.is_published = true
            )
          ) ORDER BY c.order_index
        ) FILTER (WHERE c.id IS NOT NULL) as courses
       FROM learning_paths lp
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN courses c ON c.path_id = lp.id AND c.is_public = true
       WHERE lp.slug = $1
       GROUP BY lp.id, d.id`,
      [slug]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Learning path not found');
    }

    return result.rows[0];
  }

  // ==================== COURSES ====================
  async getAllCourses(filters?: {
    isPublished?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (filters?.isPublished !== undefined) {
      conditions.push(`c.is_public = $${paramCount++}`);
      params.push(filters.isPublished);
    }

    if (filters?.search) {
      conditions.push(`(c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount})`);
      params.push(`%${filters.search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get courses with nested data
    const coursesResult = await this.db.query(
      `SELECT 
        c.*,
        json_build_object(
          'id', lp.id,
          'slug', lp.slug,
          'title', lp.title,
          'domain', json_build_object(
            'id', d.id,
            'slug', d.slug,
            'name', d.name
          )
        ) as path,
        json_agg(
          json_build_object(
            'id', m.id,
            'title', m.title,
            'description', m.description,
            'orderIndex', m.order_index,
            'isFree', m.is_free,
            'estimatedMinutes', m.estimated_minutes,
            'isPublished', m.is_published
          ) ORDER BY m.order_index
        ) FILTER (WHERE m.id IS NOT NULL) as modules
       FROM courses c
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN modules m ON m.course_id = c.id AND m.is_published = true
       ${whereClause}
       GROUP BY c.id, lp.id, d.id
       ORDER BY c.created_at DESC
       LIMIT $${paramCount++} OFFSET $${paramCount++}`,
      [...params, limit, offset]
    );

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(DISTINCT c.id) as total 
       FROM courses c 
       ${whereClause}`,
      params
    );

    const total = parseInt(countResult.rows[0].total);

    return {
      data: coursesResult.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCourseById(id: string) {
    const result = await this.db.query(
      `SELECT 
        c.*,
        json_build_object(
          'id', lp.id,
          'slug', lp.slug,
          'title', lp.title,
          'domain', json_build_object(
            'id', d.id,
            'slug', d.slug,
            'name', d.name,
            'description', d.description
          )
        ) as path,
        json_agg(
          json_build_object(
            'id', m.id,
            'title', m.title,
            'description', m.description,
            'orderIndex', m.order_index,
            'isFree', m.is_free,
            'estimatedMinutes', m.estimated_minutes,
            'isPublished', m.is_published
          ) ORDER BY m.order_index
        ) FILTER (WHERE m.id IS NOT NULL) as modules
       FROM courses c
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN modules m ON m.course_id = c.id AND m.is_published = true
       WHERE c.id = $1
       GROUP BY c.id, lp.id, d.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Course not found');
    }

    return result.rows[0];
  }

  // ==================== MODULES ====================
  async getModuleById(id: string, userId?: string) {
    const result = await this.db.query(
      `SELECT 
        m.*,
        json_build_object(
          'id', c.id,
          'title', c.title,
          'path', json_build_object(
            'id', lp.id,
            'title', lp.title,
            'domain', json_build_object(
              'id', d.id,
              'name', d.name,
              'slug', d.slug
            )
          )
        ) as course,
        json_agg(
          json_build_object(
            'id', cb.id,
            'moduleId', cb.module_id,
            'type', cb.type,
            'orderIndex', cb.order_index,
            'data', cb.data,
            'createdAt', cb.created_at,
            'updatedAt', cb.updated_at
          ) ORDER BY cb.order_index
        ) FILTER (WHERE cb.id IS NOT NULL) as "contentBlocks"
       FROM modules m
       LEFT JOIN courses c ON c.id = m.course_id
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       LEFT JOIN domains d ON d.id = lp.domain_id
       LEFT JOIN content_blocks cb ON cb.module_id = m.id
       WHERE m.id = $1
       GROUP BY m.id, c.id, lp.id, d.id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Module not found');
    }

    const module = result.rows[0];

    if (!module.is_published) {
      throw new NotFoundException('Module is not published');
    }

    // Check access: if not free, verify entitlement
    if (!module.is_free && userId) {
      const hasAccess = await this.checkModuleAccess(id, userId);
      if (!hasAccess) {
        // Return module info without content blocks
        const { contentBlocks, ...moduleWithoutContent } = module;
        return {
          ...moduleWithoutContent,
          locked: true,
          message: 'This module requires purchase or enrollment',
        };
      }
    }

    return module;
  }

  async checkModuleAccess(moduleId: string, userId: string): Promise<boolean> {
    const moduleResult = await this.db.query(
      'SELECT * FROM modules WHERE id = $1',
      [moduleId]
    );

    if (moduleResult.rows.length === 0) {
      return false;
    }

    const module = moduleResult.rows[0];

    // Module is free
    if (module.is_free) {
      return true;
    }

    // Check if user is enrolled in the course
    const enrollmentResult = await this.db.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2 LIMIT 1',
      [userId, module.course_id]
    );

    // For MVP Phase 1, we'll allow access if enrolled
    // In Phase 2, we'll check payment/license status
    return enrollmentResult.rows.length > 0;
  }

  // ==================== CONTENT ====================
  async getModuleContent(moduleId: string, userId?: string) {
    const result = await this.db.query(
      `SELECT 
        m.id,
        m.title,
        m.description,
        m.estimated_minutes,
        m.is_free,
        m.is_published,
        m.course_id,
        json_agg(
          json_build_object(
            'id', cb.id,
            'moduleId', cb.module_id,
            'type', cb.type,
            'orderIndex', cb.order_index,
            'data', cb.data,
            'createdAt', cb.created_at,
            'updatedAt', cb.updated_at
          ) ORDER BY cb.order_index
        ) FILTER (WHERE cb.id IS NOT NULL) as "contentBlocks"
       FROM modules m
       LEFT JOIN content_blocks cb ON cb.module_id = m.id
       WHERE m.id = $1
       GROUP BY m.id`,
      [moduleId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException('Module not found');
    }

    const module = result.rows[0];

    if (!module.is_published) {
      throw new NotFoundException('Module is not published');
    }

    // Check access
    if (!module.is_free && userId) {
      const hasAccess = await this.checkModuleAccess(moduleId, userId);
      if (!hasAccess) {
        throw new NotFoundException('Module is locked. Purchase required.');
      }
    }

    return {
      module: {
        id: module.id,
        title: module.title,
        description: module.description,
        estimatedMinutes: module.estimated_minutes,
      },
      contentBlocks: module.contentBlocks || [],
    };
  }
}

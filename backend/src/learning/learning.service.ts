import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateModuleProgressDto } from './dto/update-module-progress.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class LearningService {
  constructor(private db: DatabaseService) {}

  // ==================== ENROLLMENTS ====================
  async createEnrollment(userId: string, dto: CreateEnrollmentDto) {
    const { courseId, organizationId, source } = dto;

    return this.db.transaction(async (client) => {
      // Check if course exists
      const courseResult = await client.query(
        'SELECT id FROM courses WHERE id = $1',
        [courseId]
      );

      if (courseResult.rows.length === 0) {
        throw new NotFoundException('Course not found');
      }

      // Check if already enrolled
      const existingResult = await client.query(
        `SELECT id FROM enrollments 
         WHERE user_id = $1 AND course_id = $2 AND organization_id IS NOT DISTINCT FROM $3`,
        [userId, courseId, organizationId || null]
      );

      if (existingResult.rows.length > 0) {
        throw new ConflictException('Already enrolled in this course');
      }

      // Create enrollment
      const enrollmentResult = await client.query(
        `INSERT INTO enrollments (id, user_id, course_id, organization_id)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [randomUUID(), userId, courseId, organizationId || null]
      );

      // Get enrollment with course details
      const result = await client.query(
        `SELECT 
          e.*,
          json_build_object(
            'id', c.id,
            'title', c.title,
            'description', c.description,
            'level', c.level,
            'path', json_build_object(
              'id', lp.id,
              'title', lp.title,
              'slug', lp.slug,
              'domain', json_build_object(
                'id', d.id,
                'name', d.name,
                'slug', d.slug
              )
            )
          ) as course
         FROM enrollments e
         LEFT JOIN courses c ON c.id = e.course_id
         LEFT JOIN learning_paths lp ON lp.id = c.path_id
         LEFT JOIN domains d ON d.id = lp.domain_id
         WHERE e.id = $1`,
        [enrollmentResult.rows[0].id]
      );

      return result.rows[0];
    });
  }

  async getUserEnrollments(userId: string) {
    const result = await this.db.query(
      `SELECT 
        e.*,
        json_build_object(
          'id', c.id,
          'pathId', c.path_id,
          'title', c.title,
          'description', c.description,
          'level', c.level,
          'orderIndex', c.order_index,
          'isPublic', c.is_public,
          'createdAt', c.created_at,
          'path', json_build_object(
            'id', lp.id,
            'slug', lp.slug,
            'title', lp.title,
            'domain', json_build_object(
              'id', d.id,
              'name', d.name,
              'slug', d.slug
            )
          ),
          'modules', (
            SELECT json_agg(
              json_build_object(
                'id', m.id,
                'title', m.title,
                'description', m.description,
                'orderIndex', m.order_index,
                'isFree', m.is_free,
                'estimatedMinutes', m.estimated_minutes,
                'isPublished', m.is_published
              ) ORDER BY m.order_index
            )
            FROM modules m
            WHERE m.course_id = c.id AND m.is_published = true
          )
        ) as course
       FROM enrollments e
       LEFT JOIN courses c ON c.id = e.course_id
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       LEFT JOIN domains d ON d.id = lp.domain_id
       WHERE e.user_id = $1
       ORDER BY e.created_at DESC`,
      [userId]
    );

    return result.rows;
  }

  // ==================== PROGRESS ====================
  async getModuleProgress(userId: string, moduleId: string) {
    let progressResult = await this.db.query(
      `SELECT 
        mp.*,
        json_build_object(
          'id', m.id,
          'title', m.title,
          'courseId', m.course_id,
          'course', json_build_object(
            'id', c.id,
            'title', c.title
          )
        ) as module
       FROM module_progress mp
       LEFT JOIN modules m ON m.id = mp.module_id
       LEFT JOIN courses c ON c.id = m.course_id
       WHERE mp.user_id = $1 AND mp.module_id = $2`,
      [userId, moduleId]
    );

    // Create progress if it doesn't exist
    if (progressResult.rows.length === 0) {
      const createResult = await this.db.query(
        `INSERT INTO module_progress (id, user_id, module_id, started_at, progress_percent, status)
         VALUES ($1, $2, $3, NOW(), 0, 'IN_PROGRESS')
         RETURNING *`,
        [randomUUID(), userId, moduleId]
      );

      // Get with module details
      progressResult = await this.db.query(
        `SELECT 
          mp.*,
          json_build_object(
            'id', m.id,
            'title', m.title,
            'courseId', m.course_id,
            'course', json_build_object(
              'id', c.id,
              'title', c.title
            )
          ) as module
         FROM module_progress mp
         LEFT JOIN modules m ON m.id = mp.module_id
         LEFT JOIN courses c ON c.id = m.course_id
         WHERE mp.id = $1`,
        [createResult.rows[0].id]
      );
    }

    return progressResult.rows[0];
  }

  async updateModuleProgress(userId: string, moduleId: string, dto: UpdateModuleProgressDto) {
    const { progressPercent, lastPosition } = dto;

    return this.db.transaction(async (client) => {
      // Check if progress exists
      const existingResult = await client.query(
        'SELECT id, completed_at FROM module_progress WHERE user_id = $1 AND module_id = $2',
        [userId, moduleId]
      );

      const isCompleted = progressPercent >= 95;
      let progress;

      if (existingResult.rows.length === 0) {
        // Create new progress
        const createResult = await client.query(
          `INSERT INTO module_progress (id, user_id, module_id, started_at, progress_percent, status, completed_at)
           VALUES ($1, $2, $3, NOW(), $4, $5, $6)
           RETURNING *`,
          [
            randomUUID(),
            userId,
            moduleId,
            progressPercent,
            isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            isCompleted ? new Date() : null
          ]
        );
        progress = createResult.rows[0];
      } else {
        // Update existing progress
        const existing = existingResult.rows[0];
        const updateResult = await client.query(
          `UPDATE module_progress 
           SET progress_percent = $1,
               status = $2,
               completed_at = $3,
               updated_at = NOW()
           WHERE user_id = $4 AND module_id = $5
           RETURNING *`,
          [
            progressPercent,
            isCompleted ? 'COMPLETED' : 'IN_PROGRESS',
            isCompleted && !existing.completed_at ? new Date() : existing.completed_at,
            userId,
            moduleId
          ]
        );
        progress = updateResult.rows[0];
      }

      // Track event
      await client.query(
        `INSERT INTO events (id, user_id, event_type, ref_id, metadata, occurred_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          randomUUID(),
          userId,
          isCompleted ? 'MODULE_COMPLETE' : 'MODULE_PROGRESS',
          moduleId,
          JSON.stringify({ progressPercent, lastPosition })
        ]
      );

      return progress;
    });
  }

  async getUserProgress(userId: string, courseId?: string) {
    const conditions = ['mp.user_id = $1'];
    const params: any[] = [userId];

    if (courseId) {
      conditions.push('m.course_id = $2');
      params.push(courseId);
    }

    const result = await this.db.query(
      `SELECT 
        mp.*,
        json_build_object(
          'id', m.id,
          'title', m.title,
          'courseId', m.course_id,
          'orderIndex', m.order_index,
          'course', json_build_object(
            'id', c.id,
            'title', c.title,
            'pathId', c.path_id,
            'path', json_build_object(
              'id', lp.id,
              'title', lp.title,
              'slug', lp.slug
            )
          )
        ) as module
       FROM module_progress mp
       LEFT JOIN modules m ON m.id = mp.module_id
       LEFT JOIN courses c ON c.id = m.course_id
       LEFT JOIN learning_paths lp ON lp.id = c.path_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY mp.started_at DESC`,
      params
    );

    return result.rows;
  }

  // ==================== MY LEARNING DASHBOARD ====================
  async getMyLearningDashboard(userId: string) {
    const enrollments = await this.getUserEnrollments(userId);
    const progress = await this.getUserProgress(userId);

    // Calculate stats
    const totalEnrolled = enrollments.length;
    const completedModules = progress.filter((p) => p.completed_at).length;
    const inProgressModules = progress.filter(
      (p) => !p.completed_at && Number(p.progress_percent) > 0
    ).length;

    // Get recent activity
    const progressRecords = progress.slice(0, 10);

    return {
      stats: {
        totalEnrolled,
        completedModules,
        inProgressModules,
      },
      enrollments,
      progressRecords,
    };
  }
}

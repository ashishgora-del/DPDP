import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly db: DatabaseService) {}

  async createProject(userId: string, dto: CreateProjectDto) {
    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO projects (id, user_id, name)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, userId, dto.name.trim()]
    );
    const p = result.rows[0];
    this.logger.log(`Project created: ${id} for user ${userId}`);
    return this.mapRow(p);
  }

  async getUserProjects(userId: string) {
    // Fetch projects with latest assessment info per project
    const result = await this.db.query(
      `SELECT
         p.*,
         ra.id            AS latest_assessment_id,
         ra.risk_tier     AS risk_tier,
         ra.updated_at    AS last_activity,
         (
           SELECT COUNT(*)::int
           FROM generated_documents gd
           WHERE gd.assessment_id = ra.id
         ) AS templates_generated
       FROM projects p
       LEFT JOIN LATERAL (
         SELECT id, risk_tier, updated_at
         FROM risk_assessments
         WHERE project_id = p.id
         ORDER BY created_at DESC
         LIMIT 1
       ) ra ON true
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      latestAssessmentId: row.latest_assessment_id ?? null,
      riskTier: row.risk_tier ?? null,
      templatesGenerated: row.templates_generated ?? 0,
      lastActivity: row.last_activity ?? row.updated_at,
    }));
  }

  async getProject(id: string, userId: string) {
    const result = await this.db.query(
      `SELECT * FROM projects WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      throw new NotFoundException(`Project ${id} not found`);
    }
    const p = result.rows[0];
    if (p.user_id !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return this.mapRow(p);
  }

  async deleteProject(id: string, userId: string) {
    await this.getProject(id, userId); // ownership check
    await this.db.query(`DELETE FROM projects WHERE id = $1`, [id]);
    this.logger.log(`Project deleted: ${id}`);
    return { success: true, id };
  }

  /**
   * Get saved artifact selections for a project.
   * Returns an array of { artifactId, selected } — only rows that exist in the table.
   * Artifacts missing from the table are treated as selected=true (default opt-in).
   */
  async getSelections(projectId: string, userId: string) {
    await this.getProject(projectId, userId); // ownership check
    const result = await this.db.query(
      `SELECT artifact_id, selected FROM project_artifact_selections WHERE project_id = $1`,
      [projectId]
    );
    return result.rows.map(r => ({ artifactId: r.artifact_id, selected: r.selected }));
  }

  /**
   * Upsert artifact selections for a project.
   * Accepts array of { artifactId, selected }.
   */
  async upsertSelections(
    projectId: string,
    userId: string,
    selections: { artifactId: string; selected: boolean }[]
  ) {
    await this.getProject(projectId, userId); // ownership check
    if (selections.length === 0) return { saved: 0 };

    // Build bulk upsert
    const values: any[] = [];
    const placeholders = selections.map((s, i) => {
      values.push(projectId, s.artifactId, s.selected);
      const base = i * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3}, NOW())`;
    });

    await this.db.query(
      `INSERT INTO project_artifact_selections (project_id, artifact_id, selected, updated_at)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (project_id, artifact_id)
       DO UPDATE SET selected = EXCLUDED.selected, updated_at = NOW()`,
      values
    );

    this.logger.log(`Saved ${selections.length} artifact selections for project ${projectId}`);
    return { saved: selections.length };
  }

  /**
   * Get saved compliance checklist state for a project.
   * Returns only rows that exist in the table; missing item_ids default to checked=false.
   */
  async getChecklist(projectId: string, userId: string) {
    await this.getProject(projectId, userId); // ownership check
    const result = await this.db.query(
      `SELECT item_id, checked FROM project_checklist_items WHERE project_id = $1`,
      [projectId]
    );
    return result.rows.map(r => ({ itemId: r.item_id, checked: r.checked }));
  }

  /**
   * Upsert compliance checklist state for a project.
   * Accepts array of { itemId, checked }.
   */
  async upsertChecklist(
    projectId: string,
    userId: string,
    items: { itemId: string; checked: boolean }[]
  ) {
    await this.getProject(projectId, userId); // ownership check
    if (items.length === 0) return { saved: 0 };

    const values: any[] = [];
    const placeholders = items.map((item, i) => {
      values.push(projectId, item.itemId, item.checked);
      const base = i * 3;
      return `($${base + 1}, $${base + 2}, $${base + 3}, NOW())`;
    });

    await this.db.query(
      `INSERT INTO project_checklist_items (project_id, item_id, checked, updated_at)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT (project_id, item_id)
       DO UPDATE SET checked = EXCLUDED.checked, updated_at = NOW()`,
      values
    );

    this.logger.log(`Saved ${items.length} checklist items for project ${projectId}`);
    return { saved: items.length };
  }

  /**
   * Check if a project is eligible for compliance tracking.
   * Requirements:
   * - Project exists and user has access
   * - Project has at least one risk assessment
   * - Project has at least one generated template
   */
  async checkComplianceEligibility(projectId: string, userId: string) {
    // Check ownership and get project
    const project = await this.getProject(projectId, userId);

    // Check if project has an assessment
    const assessmentResult = await this.db.query(
      `SELECT id FROM risk_assessments WHERE project_id = $1 LIMIT 1`,
      [projectId]
    );
    const hasAssessment = assessmentResult.rows.length > 0;

    // Check if project has templates (documents linked to assessments)
    const docCountResult = await this.db.query(
      `SELECT COUNT(*) as count FROM generated_documents gd
       INNER JOIN risk_assessments ra ON gd.assessment_id = ra.id
       WHERE ra.project_id = $1`,
      [projectId]
    );
    const docCount = parseInt(docCountResult.rows[0].count, 10);
    const hasTemplates = docCount > 0;

    // Determine eligibility
    const eligible = hasAssessment && hasTemplates;
    let reason = null;

    if (!hasAssessment) {
      reason = 'Complete risk assessment first';
    } else if (!hasTemplates) {
      reason = 'Complete template generation first';
    }

    this.logger.log(
      `Compliance eligibility check for ${projectId}: eligible=${eligible}, hasAssessment=${hasAssessment}, hasTemplates=${hasTemplates}`
    );

    return {
      eligible,
      reason,
      requirements: {
        hasProject: true,
        hasAssessment,
        hasTemplates,
      },
      templateCount: docCount,
    };
  }

  /**
   * Upload an attachment for a compliance checklist item.
   * File content is stored as base64 in the database.
   */
  async uploadAttachment(
    projectId: string,
    userId: string,
    dto: { checklistItemId: string; fileName: string; fileData: string; fileSize: number; fileType: string }
  ) {
    await this.getProject(projectId, userId); // ownership check

    const id = randomUUID();
    const result = await this.db.query(
      `INSERT INTO compliance_attachments (id, project_id, checklist_item_id, file_name, file_data, file_size, file_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, project_id, checklist_item_id, file_name, file_size, file_type, uploaded_at`,
      [id, projectId, dto.checklistItemId, dto.fileName, dto.fileData, dto.fileSize, dto.fileType, userId]
    );

    const att = result.rows[0];
    this.logger.log(`Attachment uploaded: ${id} for project ${projectId}, item ${dto.checklistItemId}`);

    return {
      id: att.id,
      projectId: att.project_id,
      checklistItemId: att.checklist_item_id,
      fileName: att.file_name,
      fileSize: att.file_size,
      fileType: att.file_type,
      uploadedAt: att.uploaded_at,
    };
  }

  /**
   * Get all attachments for a specific checklist item or all items if itemId is null.
   */
  async getAttachments(projectId: string, userId: string, checklistItemId?: string) {
    await this.getProject(projectId, userId); // ownership check

    let query: string;
    let params: any[];

    if (checklistItemId) {
      query = `SELECT id, project_id, checklist_item_id, file_name, file_size, file_type, uploaded_at
               FROM compliance_attachments
               WHERE project_id = $1 AND checklist_item_id = $2
               ORDER BY uploaded_at DESC`;
      params = [projectId, checklistItemId];
    } else {
      query = `SELECT id, project_id, checklist_item_id, file_name, file_size, file_type, uploaded_at
               FROM compliance_attachments
               WHERE project_id = $1
               ORDER BY uploaded_at DESC`;
      params = [projectId];
    }

    const result = await this.db.query(query, params);

    return result.rows.map(att => ({
      id: att.id,
      projectId: att.project_id,
      checklistItemId: att.checklist_item_id,
      fileName: att.file_name,
      fileSize: att.file_size,
      fileType: att.file_type,
      uploadedAt: att.uploaded_at,
    }));
  }

  /**
   * Delete an attachment by ID.
   */
  async deleteAttachment(projectId: string, userId: string, attachmentId: string) {
    await this.getProject(projectId, userId); // ownership check

    const result = await this.db.query(
      `DELETE FROM compliance_attachments
       WHERE id = $1 AND project_id = $2
       RETURNING id`,
      [attachmentId, projectId]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Attachment ${attachmentId} not found`);
    }

    this.logger.log(`Attachment deleted: ${attachmentId} from project ${projectId}`);
    return { success: true, id: attachmentId };
  }

  private mapRow(p: any) {
    return {
      id: p.id,
      userId: p.user_id,
      name: p.name,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    };
  }
}

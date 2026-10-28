import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { SubmitAssessmentDto } from './dto/submit-assessment.dto';
import { RiskCalculationResult, RiskTier } from './dto/assessment-response.dto';
import { Artifact } from '../database/database.types';
import { randomUUID } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface TemplateMatrixItem {
  rowNumber: number;
  parentCategory: string;
  artifactId: string;
  name: string;
  description: string;
  lowRiskMandatory: boolean;
  mediumRiskMandatory: boolean;
  highRiskMandatory: boolean;
  applicableRiskTiers: RiskTier[];
}

interface TemplateMatrixFile {
  version: string;
  source: string;
  totalTemplates: number;
  items: TemplateMatrixItem[];
}

interface TemplateMapping {
  mappingVersion: string;
  selectedParents: Array<{
    parentId: string;
    parentName: string;
    selectionReason: string;
    children: Array<{
      templateId: string;
      templateName: string;
      applicability: 'mandatory' | 'recommended';
      reasonCodes: string[];
    }>;
  }>;
  summaryCounts: {
    parentCount: number;
    childCount: number;
    mandatoryCount: number;
    recommendedCount: number;
  };
}

@Injectable()
export class RiskAssessmentService {
  private readonly logger = new Logger(RiskAssessmentService.name);
  private readonly thresholds = {
    basicMax: 35,
    moderateMax: 65,
    highMin: 66,
    sdfThreshold: 66,
  };
  private readonly templateMatrixItems: TemplateMatrixItem[];
  private mappingVersion = 'database-fallback';

  constructor(private readonly db: DatabaseService) {
    this.templateMatrixItems = this.loadTemplateMatrixItems();
  }

  private loadTemplateMatrixItems(): TemplateMatrixItem[] {
    const candidatePaths = [
      join(process.cwd(), 'src', 'risk-assessment', 'data', 'template-parent-child-mapping.json'),
      join(__dirname, 'data', 'template-parent-child-mapping.json'),
      join(__dirname, '..', 'risk-assessment', 'data', 'template-parent-child-mapping.json'),
    ];

    const filePath = candidatePaths.find(path => existsSync(path));
    if (!filePath) {
      this.logger.warn('Template matrix file not found, will fallback to artifacts table');
      return [];
    }

    try {
      const content = readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
      const parsed = JSON.parse(content) as TemplateMatrixFile;
      if (!Array.isArray(parsed.items)) {
        this.logger.warn('Template matrix file has invalid format, will fallback to artifacts table');
        return [];
      }

      const validRiskTiers: RiskTier[] = ['BASIC', 'MODERATE', 'HIGH'];
      const artifactIds = new Set<string>();
      const validItems = parsed.items.every(item => {
        const valid = !!item &&
          typeof item.parentCategory === 'string' &&
          typeof item.artifactId === 'string' &&
          !artifactIds.has(item.artifactId) &&
          typeof item.name === 'string' &&
          typeof item.description === 'string' &&
          typeof item.lowRiskMandatory === 'boolean' &&
          typeof item.mediumRiskMandatory === 'boolean' &&
          typeof item.highRiskMandatory === 'boolean' &&
          Array.isArray(item.applicableRiskTiers) &&
          item.applicableRiskTiers.every(tier => validRiskTiers.includes(tier));
        if (valid) artifactIds.add(item.artifactId);
        return valid;
      });
      if (!validItems || parsed.totalTemplates !== parsed.items.length || typeof parsed.version !== 'string') {
        this.logger.warn('Template matrix failed schema validation, will fallback to artifacts table');
        return [];
      }

      this.mappingVersion = parsed.version || 'unversioned';
      this.logger.log(`Loaded template matrix: ${parsed.items.length} templates from ${filePath}`);
      return parsed.items;
    } catch (error) {
      this.logger.warn(`Failed to parse template matrix file: ${(error as Error).message}`);
      return [];
    }
  }

  private getFocusMatchReasons(item: TemplateMatrixItem, focusAreas: string[]): string[] {
    const searchable = `${item.parentCategory} ${item.name} ${item.description}`.toLowerCase();

    const tokenize = (value: string) =>
      value
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter(token => token.length >= 4 && !['with', 'from', 'that', 'this', 'data'].includes(token));

    return focusAreas.filter(area => {
      const tokens = tokenize(area);
      if (tokens.length === 0) {
        return searchable.includes(area.toLowerCase());
      }

      return tokens.some(token => searchable.includes(token));
    });
  }

  private buildTemplateGroupsFromMatrix(riskTier: RiskTier, focusAreas: string[], researchPurpose: boolean): any[] {
    const filteredItems = this.templateMatrixItems.filter(item =>
      (Array.isArray(item.applicableRiskTiers) && item.applicableRiskTiers.includes(riskTier)) ||
      (researchPurpose && item.artifactId === 'RESEARCH_ARCHIVAL_STATISTICAL_EXEMPTION'),
    );

    const byCategory: Record<string, any> = {};
    for (const item of filteredItems) {
      const category = item.parentCategory || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = {
          parentCategory: category,
          children: [],
          mandatoryCount: 0,
          focusMatchedCount: 0,
        };
      }

      const matchReasons = this.getFocusMatchReasons(item, focusAreas);
      const focusMatched = matchReasons.length > 0;

      const scenarioReview = item.artifactId === 'RESEARCH_ARCHIVAL_STATISTICAL_EXEMPTION' && researchPurpose;
      const mandatory = !scenarioReview && (riskTier === 'BASIC'
        ? item.lowRiskMandatory
        : riskTier === 'MODERATE'
          ? item.mediumRiskMandatory
          : item.highRiskMandatory);
      const reasonCodes = scenarioReview
        ? ['SCENARIO_RESEARCH_REVIEW']
        : [mandatory ? `TIER_${riskTier}_MANDATORY` : `TIER_${riskTier}_RECOMMENDED`];
      if (focusMatched) reasonCodes.push('FOCUS_AREA_MATCH');

      byCategory[category].children.push({
        artifactId: item.artifactId,
        name: item.name,
        description: item.description,
        mandatory,
        applicability: mandatory ? 'mandatory' : 'recommended',
        reasonCodes,
        focusMatched,
        matchReasons,
      });
      if (mandatory) byCategory[category].mandatoryCount += 1;
      if (focusMatched) byCategory[category].focusMatchedCount += 1;
    }

    return Object.values(byCategory);
  }

  private async buildTemplateGroupsFromArtifacts(riskTier: RiskTier, focusAreas: string[]): Promise<any[]> {
    const result = await this.db.query<Artifact>(
      `SELECT * FROM artifacts
       WHERE is_active = true
         AND (applicable_risk_tiers IS NULL OR applicable_risk_tiers @> $1)
       ORDER BY category ASC, name ASC`,
      [JSON.stringify([riskTier])],
    );

    const byCategory: Record<string, any> = {};
    for (const artifact of result.rows) {
      const category = artifact.category || 'Other';
      if (!byCategory[category]) {
        byCategory[category] = {
          parentCategory: category,
          children: [],
          mandatoryCount: 0,
          focusMatchedCount: 0,
        };
      }

      const artifactFocusAreas = Array.isArray(artifact.applicable_focus_areas)
        ? artifact.applicable_focus_areas
        : [];
      const matchReasons = artifactFocusAreas.filter(a => focusAreas.includes(a));
      const focusMatched = matchReasons.length > 0;
      const reasonCodes = ['TIER_ARTIFACT_APPLICABLE'];
      if (focusMatched) reasonCodes.push('FOCUS_AREA_MATCH');

      byCategory[category].children.push({
        artifactId: artifact.artifact_id,
        name: artifact.name,
        description: artifact.description,
        mandatory: true,
        applicability: 'mandatory',
        reasonCodes,
        focusMatched,
        matchReasons,
      });
      byCategory[category].mandatoryCount += 1;
      if (focusMatched) byCategory[category].focusMatchedCount += 1;
    }

    return Object.values(byCategory);
  }

  /**
   * Calculate normalized risk score (0-100) and derive tier from configured thresholds.
   * This aligns backend scoring behavior with the new weighted + denominator-aware model.
   */
  calculateRiskTier(dto: SubmitAssessmentDto): RiskCalculationResult {
    let weightedScore = 0;
    let weightedMax = 0;

    const focusAreas: string[] = [];
    const riskDrivers: string[] = [];
    const addWeighted = (score: number, max: number, weight = 1) => {
      weightedScore += score * weight;
      weightedMax += max * weight;
    };

    const parseCsv = (value: string): string[] =>
      String(value || '')
        .split(',')
        .map(v => v.trim().toLowerCase())
        .filter(Boolean);

    // Q1 Organization profile: max 2
    const org = String(dto.q1_orgProfile || '').toLowerCase();
    const q1Score = ['fintech', 'healthcare', 'edtech'].includes(org)
      ? 2
      : ['ecommerce', 'saas'].includes(org)
        ? 1
        : 0;
    addWeighted(q1Score, 2, 1.2);

    // Q2 Geography: max 2
    const geo = String(dto.q2_geography || '').toLowerCase();
    const q2Score = geo === 'international' ? 2 : ['pan-india', 'multiple-states'].includes(geo) ? 1 : 0;
    addWeighted(q2Score, 2, 1.0);

    if (geo === 'international') {
      focusAreas.push('Multi-jurisdictional Compliance', 'Cross-Border Transfer Compliance');
      riskDrivers.push('International data exposure');
    } else if (q2Score > 0) {
      focusAreas.push('Multi-jurisdictional Compliance');
    }

    // Q3 Data principals: max 3 (children is strongest trigger)
    const principals = parseCsv(dto.q3_dataPrincipals);
    const q3Score = principals.includes('children') ? 3 : principals.includes('customers') ? 1 : 0;
    addWeighted(q3Score, 3, 1.3);

    if (principals.includes('children')) {
      riskDrivers.push('Processing children\'s data');
      focusAreas.push('Parental Consent & Children Safeguards');
    }
    if (principals.includes('employees')) focusAreas.push('Employee Data Governance');
    if (principals.includes('customers')) focusAreas.push('Consent Management');

    // Q4 Large scale: max 2
    const largeScale = String(dto.q4_largeScale || '').toLowerCase();
    const q4Score = largeScale === 'yes' ? 2 : largeScale === 'unsure' ? 1 : 0;
    addWeighted(q4Score, 2, 1.2);
    if (largeScale === 'yes') {
      riskDrivers.push('Large-scale data processing');
      focusAreas.push('SDF Compliance & DPIA');
    }

    // Q5 Data types: max 3
    const dataTypes = parseCsv(dto.q5_dataTypes);
    const sensitiveTypes = ['financial', 'health', 'biometric', 'genetic', 'religious', 'caste'];
    const hasSensitiveData = sensitiveTypes.some(type => dataTypes.includes(type));
    const q5Score = hasSensitiveData ? 3 : dataTypes.includes('behavioral') ? 1 : 0;
    addWeighted(q5Score, 3, 1.2);
    if (hasSensitiveData) {
      riskDrivers.push('Processing sensitive personal data');
      focusAreas.push('Sensitive Data Protection');
    }

    // Q6 Purpose: max 2
    const purposes = parseCsv(dto.q6_purposes);
    const q6Score = purposes.includes('profiling') || purposes.includes('automated-decision')
      ? 2
      : purposes.includes('marketing') || purposes.includes('analytics')
        ? 1
        : 0;
    addWeighted(q6Score, 2, 1.0);
    if (q6Score >= 2) {
      riskDrivers.push('Automated decision-making and profiling');
      focusAreas.push('Automated Decision-Making Transparency');
    }

    // Q7 AI use: max 2
    const aiUse = String(dto.q7_aiUse || '').toLowerCase();
    const q7Score = aiUse === 'yes' ? 2 : aiUse === 'limited' ? 1 : 0;
    addWeighted(q7Score, 2, 1.1);
    if (q7Score > 0) {
      riskDrivers.push('AI/ML usage in data processing');
      focusAreas.push('AI Governance & Algorithmic Transparency');
    }

    // Q8 Vendors: max 2
    const vendors = String(dto.q8_vendors || '').toLowerCase();
    const q8Score = vendors === 'multiple' ? 2 : vendors === 'few' ? 1 : 0;
    addWeighted(q8Score, 2, 1.0);
    if (q8Score > 0) {
      riskDrivers.push('Third-party processor dependency');
      focusAreas.push('Data Processing Agreements (DPAs)');
    }

    // Q9 Cross-border: max 2
    const crossBorder = String(dto.q9_crossBorder || '').toLowerCase();
    const q9Score = crossBorder === 'yes' ? 2 : 0;
    addWeighted(q9Score, 2, 1.1);
    if (q9Score > 0) {
      riskDrivers.push('Cross-border data transfers');
      if (!focusAreas.includes('Cross-Border Transfer Compliance')) {
        focusAreas.push('Cross-Border Transfer Compliance');
      }
    }

    // Q10 Volume: max 2
    const volume = String(dto.q10_volume || '').toLowerCase();
    const q10Score = volume === '>1m' ? 2 : volume === '100k-1m' ? 1 : 0;
    addWeighted(q10Score, 2, 1.1);
    if (q10Score >= 2) {
      riskDrivers.push('Large population impact');
      if (!focusAreas.includes('SDF Compliance & DPIA')) {
        focusAreas.push('SDF Compliance & DPIA');
      }
    }

    const normalizedScore = weightedMax > 0
      ? Number(((weightedScore / weightedMax) * 100).toFixed(2))
      : 0;

    // Always include these basic focus areas
    if (!focusAreas.includes('Privacy Notice')) {
      focusAreas.unshift('Privacy Notice');
    }
    if (!focusAreas.includes('Consent Management')) {
      focusAreas.push('Consent Management');
    }

    // Determine risk tier
    const riskTier = this.resolveRiskTier(normalizedScore);
    const templatePackId = riskTier === 'HIGH' ? 'high' : riskTier === 'MODERATE' ? 'medium' : 'low';

    const sdfFlag = normalizedScore >= this.thresholds.sdfThreshold;

    // Remove duplicates
    const uniqueFocusAreas = [...new Set(focusAreas)];
    const uniqueRiskDrivers = [...new Set(riskDrivers)];

    this.logger.log(`Risk calculation: normalizedScore=${normalizedScore}, tier=${riskTier}, sdf=${sdfFlag}`);

    return {
      riskTier,
      focusAreas: uniqueFocusAreas,
      sdfFlag,
      riskDrivers: uniqueRiskDrivers,
      templatePackId,
      normalizedScore,
    };
  }

  private async buildTemplateGroups(riskTier: RiskTier, focusAreas: string[], researchPurpose = false): Promise<any[]> {
    if (this.templateMatrixItems.length > 0) {
      return this.buildTemplateGroupsFromMatrix(riskTier, focusAreas, researchPurpose);
    }

    return this.buildTemplateGroupsFromArtifacts(riskTier, focusAreas);
  }

  private resolveRiskTier(normalizedScore: number): RiskTier {
    if (normalizedScore >= this.thresholds.highMin) return 'HIGH';
    if (normalizedScore > this.thresholds.basicMax && normalizedScore <= this.thresholds.moderateMax) return 'MODERATE';
    return 'BASIC';
  }

  private buildMapping(templateGroups: any[]): TemplateMapping {
    const selectedParents = templateGroups.map(group => ({
      parentId: group.parentCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      parentName: group.parentCategory,
      selectionReason: group.children.some(child => child.reasonCodes.includes('SCENARIO_RESEARCH_REVIEW'))
        ? 'Research purpose selected; verify exemption eligibility.'
        : 'Contains templates applicable to the assessed risk tier.',
      children: group.children.map(child => ({
        templateId: child.artifactId,
        templateName: child.name,
        applicability: child.applicability as 'mandatory' | 'recommended',
        reasonCodes: child.reasonCodes as string[],
      })),
    }));
    const children = selectedParents.flatMap(parent => parent.children);

    return {
      mappingVersion: this.mappingVersion,
      selectedParents,
      summaryCounts: {
        parentCount: selectedParents.length,
        childCount: children.length,
        mandatoryCount: children.filter(child => child.applicability === 'mandatory').length,
        recommendedCount: children.filter(child => child.applicability === 'recommended').length,
      },
    };
  }

  private hasResearchPurpose(purposes: string): boolean {
    return String(purposes || '').split(',').some(purpose => purpose.trim().toLowerCase() === 'research');
  }

  /**
   * Create new assessment
   */
  async createAssessment(userId: string, dto: SubmitAssessmentDto) {
    // Calculate risk
    const riskResult = this.calculateRiskTier(dto);

    const assessmentId = randomUUID();

    // Insert into database
    const result = await this.db.query(
      `INSERT INTO risk_assessments (
        id, user_id, org_name,
        q1_org_profile, q2_geography, q3_data_principals, q4_large_scale,
        q5_data_types, q6_purposes, q7_ai_use, q8_vendors,
        q9_cross_border, q10_volume,
        risk_tier, focus_areas, sdf_flag, risk_drivers, template_pack_id,
        project_id,
        updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        assessmentId,
        userId,
        dto.orgName,
        dto.q1_orgProfile,
        dto.q2_geography,
        dto.q3_dataPrincipals,
        dto.q4_largeScale,
        dto.q5_dataTypes,
        dto.q6_purposes,
        dto.q7_aiUse,
        dto.q8_vendors,
        dto.q9_crossBorder,
        dto.q10_volume,
        riskResult.riskTier,
        JSON.stringify(riskResult.focusAreas), // Convert to JSON string for JSONB
        riskResult.sdfFlag,
        JSON.stringify(riskResult.riskDrivers), // Convert to JSON string for JSONB
        riskResult.templatePackId,
        dto.projectId ?? null,
      ]
    );

    const assessment = result.rows[0];
    const templateGroups = await this.buildTemplateGroups(
      riskResult.riskTier,
      riskResult.focusAreas,
      this.hasResearchPurpose(dto.q6_purposes),
    );
    const mapping = this.buildMapping(templateGroups);

    this.logger.log(`Assessment created: ${assessmentId} for user ${userId}`);

    return {
      id: assessment.id,
      userId: assessment.user_id,
      orgName: dto.orgName,
      riskTier: assessment.risk_tier,
      focusAreas: assessment.focus_areas, // Already an array from PostgreSQL
      sdfFlag: assessment.sdf_flag,
      riskDrivers: assessment.risk_drivers, // Already an array from PostgreSQL
      templatePackId: assessment.template_pack_id,
      normalizedScore: riskResult.normalizedScore,
      templateGroups,
      mapping,
      projectId: assessment.project_id ?? null,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at,
    };
  }

  /**
   * Get assessment by ID with ownership check
   */
  async getAssessment(id: string, userId: string, isSuperAdmin: boolean = false) {
    const result = await this.db.query(
      `SELECT ra.*, p.name AS project_name
       FROM risk_assessments ra
       LEFT JOIN projects p ON p.id = ra.project_id
       WHERE ra.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Assessment with ID ${id} not found`);
    }

    const assessment = result.rows[0];

    // Security check: Verify ownership
    if (assessment.user_id !== userId && !isSuperAdmin) {
      throw new ForbiddenException('You do not have permission to access this assessment');
    }

    const templateGroups = await this.buildTemplateGroups(
      assessment.risk_tier,
      assessment.focus_areas || [],
      this.hasResearchPurpose(assessment.q6_purposes),
    );
    const mapping = this.buildMapping(templateGroups);

    return {
      id: assessment.id,
      userId: assessment.user_id,
      orgName: assessment.org_name,
      q1_orgProfile: assessment.q1_org_profile,
      q2_geography: assessment.q2_geography,
      q3_dataPrincipals: assessment.q3_data_principals,
      q4_largeScale: assessment.q4_large_scale,
      q5_dataTypes: assessment.q5_data_types,
      q6_purposes: assessment.q6_purposes,
      q7_aiUse: assessment.q7_ai_use,
      q8_vendors: assessment.q8_vendors,
      q9_crossBorder: assessment.q9_cross_border,
      q10_volume: assessment.q10_volume,
      riskTier: assessment.risk_tier,
      focusAreas: assessment.focus_areas,
      sdfFlag: assessment.sdf_flag,
      riskDrivers: assessment.risk_drivers,
      templatePackId: assessment.template_pack_id,
      normalizedScore: this.calculateRiskTier({
        orgName: assessment.org_name,
        q1_orgProfile: assessment.q1_org_profile,
        q2_geography: assessment.q2_geography,
        q3_dataPrincipals: assessment.q3_data_principals,
        q4_largeScale: assessment.q4_large_scale,
        q5_dataTypes: assessment.q5_data_types,
        q6_purposes: assessment.q6_purposes,
        q7_aiUse: assessment.q7_ai_use,
        q8_vendors: assessment.q8_vendors,
        q9_crossBorder: assessment.q9_cross_border,
        q10_volume: assessment.q10_volume,
        projectId: assessment.project_id ?? undefined,
      }).normalizedScore,
      templateGroups,
      mapping,
      projectId: assessment.project_id ?? null,
      projectName: assessment.project_name ?? null,
      createdAt: assessment.created_at,
      updatedAt: assessment.updated_at,
    };
  }

  /**
   * Get all assessments for a user with pagination
   */
  async getUserAssessments(
    userId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await this.db.query(
      `SELECT COUNT(*) FROM risk_assessments WHERE user_id = $1`,
      [userId]
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    const result = await this.db.query(
      `SELECT * FROM risk_assessments 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const assessments = result.rows.map(a => ({
      id: a.id,
      userId: a.user_id,
      riskTier: a.risk_tier,
      focusAreas: a.focus_areas,
      sdfFlag: a.sdf_flag,
      templatePackId: a.template_pack_id,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assessments,
    };
  }

  /**
   * Delete assessment (with ownership check)
   */
  async deleteAssessment(id: string, userId: string, isSuperAdmin: boolean = false) {
    // First verify ownership
    await this.getAssessment(id, userId, isSuperAdmin);

    const result = await this.db.query(
      `DELETE FROM risk_assessments WHERE id = $1 RETURNING id`,
      [id]
    );

    this.logger.log(`Assessment deleted: ${id}`);

    return { success: true, id: result.rows[0].id };
  }
}

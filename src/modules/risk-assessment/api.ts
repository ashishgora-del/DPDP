import axios, { AxiosInstance } from 'axios';
































































































































































































const createApiClient = (): AxiosInstance => {
  const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor - Add JWT token
  client.interceptors.request.use(
    (config) => {
      // Try both token keys for compatibility
      const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor - Handle errors
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired or invalid
        // Don't auto-redirect for risk assessment - let the component handle it
        console.warn('Authentication required. Please log in to continue.');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

// =============================================================================
// Types
// =============================================================================

export type RiskTier = 'BASIC' | 'MODERATE' | 'HIGH';

// ---- Project types ----

export interface ProjectResponse {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithProgress extends ProjectResponse {
  latestAssessmentId: string | null;
  riskTier: RiskTier | null;
  templatesGenerated: number;
  lastActivity: string;
}

export interface SubmitAssessmentRequest {
  orgName: string;
  email?: string;
  projectId?: string;
  q1_orgProfile: string;
  q2_geography: string;
  q3_dataPrincipals: string;
  q4_largeScale: string;
  q5_dataTypes: string;
  q6_purposes: string;
  q7_aiUse: string;
  q8_vendors: string;
  q9_crossBorder: string;
  q10_volume: string;
}

export interface AssessmentResponse {
  id: string;
  userId: string;
  orgName: string;
  riskTier: RiskTier;
  focusAreas: string[];
  sdfFlag: boolean;
  riskDrivers: string[];
  templatePackId?: string;
  normalizedScore?: number;
  templateGroups?: TemplateParentGroup[];
  mapping?: TemplateMapping;
  projectId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateChild {
  artifactId: string;
  name: string;
  description: string;
  mandatory: boolean;
  applicability?: 'mandatory' | 'recommended';
  reasonCodes?: string[];
  focusMatched: boolean;
  matchReasons: string[];
}

export interface TemplateParentGroup {
  parentCategory: string;
  children: TemplateChild[];
  mandatoryCount: number;
  focusMatchedCount: number;
}

export interface TemplateMapping {
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

export interface AssessmentDetail extends AssessmentResponse {
  q1_orgProfile: string;
  q2_geography: string;
  q3_dataPrincipals: string;
  q4_largeScale: string;
  q5_dataTypes: string;
  q6_purposes: string;
  q7_aiUse: string;
  q8_vendors: string;
  q9_crossBorder: string;
  q10_volume: string;
  projectName?: string | null;
  projectId?: string | null;
}

export interface PaginatedAssessmentsResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  assessments: AssessmentResponse[];
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * Submit a new risk assessment
 */
export const submitAssessment = async (
  data: SubmitAssessmentRequest
): Promise<AssessmentResponse> => {
  const response = await apiClient.post<AssessmentResponse>(
    '/risk-assessment/submit',
    data
  );
  return response.data;
};

/**
 * Get a specific assessment by ID
 */
export const getAssessment = async (id: string): Promise<AssessmentDetail> => {
  const response = await apiClient.get<AssessmentDetail>(
    `/risk-assessment/${id}`
  );
  return response.data;
};

/**
 * Get all assessments for the current user
 */
export const getUserAssessments = async (
  page: number = 1,
  limit: number = 20
): Promise<PaginatedAssessmentsResponse> => {
  const response = await apiClient.get<PaginatedAssessmentsResponse>(
    '/risk-assessment/user/me',
    {
      params: { page, limit },
    }
  );
  return response.data;
};

/**
 * Delete an assessment
 */
export const deleteAssessment = async (id: string): Promise<void> => {
  await apiClient.delete(`/risk-assessment/${id}`);
};

// =============================================================================
// Project API Methods
// =============================================================================

/**
 * Create a new project
 */
export const createProject = async (name: string): Promise<ProjectResponse> => {
  const response = await apiClient.post<ProjectResponse>('/projects', { name });
  return response.data;
};

/**
 * Get all projects for the current user (with progress info)
 */
export const getProjects = async (): Promise<ProjectWithProgress[]> => {
  // Add timestamp to prevent browser caching stale data
  const response = await apiClient.get<ProjectWithProgress[]>('/projects', {
    params: { _t: Date.now() },
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
    },
  });
  return response.data;
};

/**
 * Get a single project by ID
 */
export const getProject = async (id: string): Promise<ProjectResponse> => {
  const response = await apiClient.get<ProjectResponse>(`/projects/${id}`);
  return response.data;
};

/**
 * Delete a project
 */
export const deleteProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/projects/${id}`);
};

// ---- Project Artifact Selections ----

export interface ArtifactSelection {
  artifactId: string;
  selected: boolean;
}

/**
 * Fetch saved artifact selections for a project.
 * Returns only the rows that were explicitly saved (missing = default true).
 */
export const getProjectSelections = async (projectId: string): Promise<ArtifactSelection[]> => {
  const response = await apiClient.get<ArtifactSelection[]>(`/projects/${projectId}/selections`);
  return response.data;
};

/**
 * Persist artifact selections for a project (upsert).
 */
export const saveProjectSelections = async (
  projectId: string,
  selections: ArtifactSelection[]
): Promise<void> => {
  await apiClient.put(`/projects/${projectId}/selections`, { selections });
};

// ---- Project Compliance Checklist ----

export interface ChecklistItemState {
  itemId: string;
  checked: boolean;
}

/**
 * Fetch saved compliance checklist state for a project.
 * Returns only rows that were explicitly saved (missing = default false/unchecked).
 */
export const getProjectChecklist = async (projectId: string): Promise<ChecklistItemState[]> => {
  const response = await apiClient.get<ChecklistItemState[]>(`/projects/${projectId}/checklist`);
  return response.data;
};

/**
 * Persist compliance checklist state for a project (upsert).
 */
export const saveProjectChecklist = async (
  projectId: string,
  items: ChecklistItemState[]
): Promise<void> => {
  await apiClient.put(`/projects/${projectId}/checklist`, { items });
};

export default apiClient;

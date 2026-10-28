import axios, { AxiosInstance } from 'axios';

// Create axios instance
const createApiClient = (): AxiosInstance => {
  const baseURL = (import.meta.env.VITE_API_URL as string) ?? 'http://localhost:3001/api';

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add JWT token
  client.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Handle 401 errors - just log warning, don't redirect
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        console.warn('Authentication required - please log in');
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

export type ArtifactCategory = 
  | 'CUSTOMER'
  | 'EMPLOYEE'
  | 'VENDOR'
  | 'AI_GOVERNANCE'
  | 'INCIDENT_RESPONSE'
  | 'SPECIAL_CATEGORIES'
  | 'CROSS_BORDER'
  | 'RECORDS_MANAGEMENT';

export type DocumentStatus = 'generated' | 'draft' | 'edited' | 'exported';

export interface Artifact {
  id: string;
  artifact_id: string;
  name: string;
  description: string;
  category: string;
  min_risk_tier: string;
  applicable_risk_tiers: string[];
  applicable_focus_areas: string[];
  prompt_template_key: string;
  output_format: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GenerateFromTemplateRequest {
  artifactId: string;
  assessmentId?: string;
  orgName: string;
  context?: Record<string, any>;
}

export interface GenerateCustomRequest {
  prompt: string;
  assessmentId?: string;
  orgName: string;
}

export interface UpdateDocumentRequest {
  content?: string;
  status?: DocumentStatus;
  title?: string;
  tone?: string;
  jurisdiction?: string;
  sector?: string;
}

export interface GeneratedDocument {
  id: string;
  user_id: string;
  title: string;
  content: string;
  artifact_id?: string;
  assessment_id?: string;
  tone?: string;
  jurisdiction?: string;
  sector?: string;
  status: DocumentStatus;
  created_at: string;
  updated_at: string;
  artifact_name?: string;
  artifact_category?: string;
}

export interface PaginatedDocumentsResponse {
  documents: GeneratedDocument[];
  total: number;
  page: number;
  totalPages: number;
}

// =============================================================================
// API Methods
// =============================================================================

/**
 * List available artifacts/templates
 */
export const listArtifacts = async (
  category?: string,
  riskTier?: string
): Promise<Artifact[]> => {
  const params: any = {};
  if (category) params.category = category;
  if (riskTier) params.riskTier = riskTier;

  const response = await apiClient.get<Artifact[]>('/template-generation/artifacts', { params });
  return response.data;
};

/**
 * Get artifact by ID
 */
export const getArtifact = async (id: string): Promise<Artifact> => {
  const response = await apiClient.get<Artifact>(`/template-generation/artifacts/${id}`);
  return response.data;
};

/**
 * Generate document from template
 */
export const generateFromTemplate = async (
  data: GenerateFromTemplateRequest
): Promise<GeneratedDocument> => {
  const response = await apiClient.post<GeneratedDocument>(
    '/template-generation/generate/template',
    data
  );
  return response.data;
};

/**
 * Generate custom document with AI
 */
export const generateCustomDocument = async (
  data: GenerateCustomRequest
): Promise<GeneratedDocument> => {
  const response = await apiClient.post<GeneratedDocument>(
    '/template-generation/generate/custom',
    data
  );
  return response.data;
};

/**
 * Get all documents for current user
 */
export const getUserDocuments = async (
  page: number = 1,
  limit: number = 20,
  assessmentId?: string
): Promise<PaginatedDocumentsResponse> => {
  const params: any = { page, limit, _t: Date.now() };
  if (assessmentId) params.assessmentId = assessmentId;
  const response = await apiClient.get<PaginatedDocumentsResponse>(
    '/template-generation/documents',
    { 
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
    }
  );
  return response.data;
};

/**
 * Get all documents for a specific assessment
 */
export const getDocumentsByAssessment = async (
  assessmentId: string
): Promise<GeneratedDocument[]> => {
  const response = await getUserDocuments(1, 100, assessmentId);
  return response.documents;
};

/**
 * Get document by ID
 */
export const getDocument = async (id: string): Promise<GeneratedDocument> => {
  const response = await apiClient.get<GeneratedDocument>(
    `/template-generation/documents/${id}`
  );
  return response.data;
};

/**
 * Update document
 */
export const updateDocument = async (
  id: string,
  data: UpdateDocumentRequest
): Promise<GeneratedDocument> => {
  const response = await apiClient.patch<GeneratedDocument>(
    `/template-generation/documents/${id}`,
    data
  );
  return response.data;
};

/**
 * Delete document
 */
export const deleteDocument = async (id: string): Promise<void> => {
  await apiClient.delete(`/template-generation/documents/${id}`);
};

// =============================================================================
// AI-Assisted Conversation API
// =============================================================================

export interface StartConversationRequest {
  templateId: string;
  assessmentId?: string;
}

export interface StartConversationResponse {
  conversationId: string;
  /** All initial messages to display: intro + first grouped AI question */
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
    type?: string;
    metadata?: Record<string, any>;
  }>;
  currentSection: {
    sectionId: string;
    sectionNumber: number;
    title: string;
    emoji: string;
    totalSections: number;
  };
  /** Full ordered list of sections in the template */
  sections: Array<{
    sectionId: string;
    sectionNumber: number;
    title: string;
    emoji: string;
  }>;
  /** Sections that were already completed in a prior session (for resume) */
  completedSections: string[];
  /** True when the user is resuming a previous partial session */
  isResuming: boolean;
}

export interface SubmitAnswerRequest {
  fieldId: string;
  value: any;
}

export interface SubmitMessageRequest {
  message: string;
}

export interface JumpToSectionRequest {
  sectionId: string;
}

export interface JumpToSectionResponse {
  success: boolean;
  aiMessage: {
    role: string;
    content: string;
    timestamp: string;
    type?: string;
  };
  currentSection: {
    sectionId: string;
    sectionNumber: number;
    title: string;
    emoji: string;
  };
  /** Updated completed sections list after removing the jumped-to section */
  updatedCompletedSections: string[];
}

export interface SubmitMessageResponse {
  success: boolean;
  aiMessage: {
    role: string;
    content: string;
    timestamp: string;
    type?: string;
  };
  sectionUpdate?: {
    sectionId: string;
    markdown: string;
    action: 'replace' | 'append';
  };
  /** Updated section info when the AI just transitioned to a new section */
  currentSection?: {
    sectionId: string;
    sectionNumber: number;
    title: string;
    emoji: string;
  } | null;
  /** 'completed' only when backend says all sections are done */
  conversationStatus?: string;
  progress: {
    currentSection: number;
    totalSections: number;
    sectionFieldsCompleted: number;
    sectionFieldsTotal: number;
    overallPercentage: number;
  };
}

export interface SubmitAnswerResponse {
  success: boolean;
  aiMessage: {
    role: string;
    content: string;
    timestamp: string;
  };
  nextField: {
    fieldId: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
    options?: string[];
    defaultValue?: any;
    aiQuestion?: string;
    validation?: {
      minLength?: number;
      maxLength?: number;
      pattern?: string;
      min?: number;
      max?: number;
    };
  } | null;
  sectionUpdate?: {
    sectionId: string;
    markdown: string;
    action: 'replace' | 'append';
  };
  /** Updated section info — present when the section just changed (transition) */
  currentSection?: {
    sectionId: string;
    sectionNumber: number;
    title: string;
    emoji: string;
  } | null;
  /** Backend conversation status — 'completed' only when all sections are done */
  conversationStatus?: string;
  progress: {
    currentSection: number;
    totalSections: number;
    sectionFieldsCompleted: number;
    sectionFieldsTotal: number;
    overallPercentage: number;
  };
}

export interface GetConversationStateResponse {
  conversationId: string;
  status: string;
  currentSection: {
    sectionId: string;
    sectionNumber: number;
    title: string;
  };
  completedSections: string[];
  messages: Array<{
    id: string;
    role: string;
    content: string;
    timestamp: string;
  }>;
  answers: Record<string, Record<string, any>>;
  progress: {
    currentSection: number;
    totalSections: number;
    overallPercentage: number;
  };
}

export interface GetTemplateStructureResponse {
  templateId: string;
  name: string;
  version: string;
  sections: Array<{
    sectionId: string;
    sectionNumber: number;
    title: string;
    emoji: string;
    description: string;
    fields: any[];
    outputTemplate?: string;
    aiInstructions?: {
      systemPrompt: string;
      contextToInclude: string[];
      tone: string;
    };
  }>;
  totalFields: number;
  estimatedTime: string;
}

/**
 * Start a new AI-assisted conversation for a document
 */
export const startConversation = async (
  documentId: string,
  data: StartConversationRequest
): Promise<StartConversationResponse> => {
  const response = await apiClient.post<StartConversationResponse>(
    `/template-generation/documents/${documentId}/start-ai-conversation`,
    data
  );
  return response.data;
};

/**
 * Submit an answer in the conversation (legacy single-field mode)
 */
export const submitAnswer = async (
  conversationId: string,
  data: SubmitAnswerRequest
): Promise<SubmitAnswerResponse> => {
  const response = await apiClient.post<SubmitAnswerResponse>(
    `/template-generation/conversations/${conversationId}/answer`,
    data
  );
  return response.data;
};

/**
 * Submit a free-text message in the conversation (grouped/conversational mode).
 * The AI extracts multiple field values from a single natural-language answer.
 */
export const submitMessage = async (
  conversationId: string,
  data: SubmitMessageRequest
): Promise<SubmitMessageResponse> => {
  const response = await apiClient.post<SubmitMessageResponse>(
    `/template-generation/conversations/${conversationId}/message`,
    data
  );
  return response.data;
};

/**
 * Jump to a specific section for editing / re-filling.
 * Existing answers are kept as defaults and shown as a summary.
 */
export const jumpToSection = async (
  conversationId: string,
  data: JumpToSectionRequest
): Promise<JumpToSectionResponse> => {
  const response = await apiClient.patch<JumpToSectionResponse>(
    `/template-generation/conversations/${conversationId}/jump-to-section`,
    data
  );
  return response.data;
};

/**
 * Get conversation state (for resume)
 */
export const getConversationState = async (
  conversationId: string
): Promise<GetConversationStateResponse> => {
  const response = await apiClient.get<GetConversationStateResponse>(
    `/template-generation/conversations/${conversationId}`
  );
  return response.data;
};

/**
 * Pause conversation
 */
export const pauseConversation = async (
  conversationId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.post<{ success: boolean; message: string }>(
    `/template-generation/conversations/${conversationId}/pause`
  );
  return response.data;
};

/**
 * Resume paused conversation
 */
export const resumeConversation = async (
  conversationId: string
): Promise<SubmitAnswerResponse> => {
  const response = await apiClient.post<SubmitAnswerResponse>(
    `/template-generation/conversations/${conversationId}/resume`
  );
  return response.data;
};

/**
 * Get template structure
 */
export const getTemplateStructure = async (
  templateId: string
): Promise<GetTemplateStructureResponse> => {
  const response = await apiClient.get<GetTemplateStructureResponse>(
    `/template-generation/templates/${templateId}/structure`
  );
  return response.data;
};

export default apiClient;

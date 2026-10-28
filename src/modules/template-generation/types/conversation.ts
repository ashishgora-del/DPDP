// ─── Conversation Types ──────────────────────────────────────────────────────

export type ConversationStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type MessageRole = 'ai' | 'user' | 'system';
export type MessageType = 'question' | 'answer' | 'transition' | 'completion' | 'error' | 'intro';
export type FieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'multiselect' 
  | 'date' 
  | 'radio' 
  | 'number' 
  | 'email' 
  | 'url';

// ─── Chat Message ────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: {
    type?: MessageType;
    sectionId?: string;
    fieldId?: string;
    error?: boolean;
  };
}

// ─── Field Definitions ───────────────────────────────────────────────────────

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex
  min?: number; // for number fields
  max?: number;
}

export interface FieldDependency {
  fieldId: string;
  condition: 'equals' | 'notEquals' | 'includes';
  value: any;
}

export interface TemplateField {
  fieldId: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  options?: string[]; // For select/multiselect/radio
  validation?: FieldValidation;
  aiQuestion: string;
  defaultValue?: any;
  dependsOn?: FieldDependency;
}

// ─── Section Definitions ─────────────────────────────────────────────────────

export interface AIInstructions {
  systemPrompt: string;
  contextToInclude: string[];
  tone: string;
}

export interface TemplateSection {
  sectionId: string;
  sectionNumber: number;
  title: string;
  emoji: string;
  description: string;
  fields: TemplateField[];
  outputTemplate: string;
  aiInstructions: AIInstructions;
}

// ─── Template Structure ──────────────────────────────────────────────────────

export interface TemplateStructure {
  id: string;
  name: string;
  version: string;
  sections: TemplateSection[];
}

// ─── Conversation State ──────────────────────────────────────────────────────

export interface SectionAnswers {
  [fieldId: string]: any;
}

export interface ConversationAnswers {
  [sectionId: string]: SectionAnswers;
}

export interface ConversationProgress {
  currentSection: number;
  totalSections: number;
  sectionFieldsCompleted: number;
  sectionFieldsTotal: number;
  overallPercentage: number;
}

export interface CurrentSection {
  sectionId: string;
  sectionNumber: number;
  title: string;
  emoji: string;
  status: 'not-started' | 'in-progress' | 'completed';
}

export interface ConversationContext {
  orgName: string;
  assessmentId?: string;
  assessmentTier?: string;
  templateId: string;
  documentId: string;
}

/** Lightweight section descriptor used for the section-navigation panel */
export interface SectionSummary {
  sectionId: string;
  sectionNumber: number;
  title: string;
  emoji: string;
}

export interface ConversationState {
  conversationId: string | null;
  status: ConversationStatus;
  currentSection: CurrentSection | null;
  completedSections: string[];
  sections: SectionSummary[];
  messages: ChatMessage[];
  answers: ConversationAnswers;
  progress: ConversationProgress;
  context: ConversationContext | null;
  nextField: TemplateField | null;
}

// ─── API Request/Response Types ──────────────────────────────────────────────

export interface StartConversationRequest {
  templateId: string;
  assessmentId?: string;
}

export interface StartConversationResponse {
  conversationId: string;
  welcomeMessage: ChatMessage;
  currentSection: CurrentSection;
  firstField: TemplateField;
}

export interface SubmitAnswerRequest {
  fieldId: string;
  value: any;
}

export interface SectionUpdate {
  sectionId: string;
  markdown: string;
  action: 'replace' | 'append';
}

export interface SubmitAnswerResponse {
  success: boolean;
  aiMessage: ChatMessage;
  nextField: TemplateField | null;
  sectionUpdate?: SectionUpdate;
  progress: ConversationProgress;
}

export interface GetConversationStateResponse {
  conversationId: string;
  status: ConversationStatus;
  currentSection: CurrentSection;
  completedSections: string[];
  messages: ChatMessage[];
  answers: ConversationAnswers;
  progress: ConversationProgress;
}

export interface PauseConversationResponse {
  success: boolean;
  message: string;
}

export interface GetTemplateStructureResponse {
  templateId: string;
  name: string;
  version: string;
  sections: TemplateSection[];
  totalFields: number;
  estimatedTime: string;
}

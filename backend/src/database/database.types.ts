// Database type definitions matching PostgreSQL schema (snake_case to reflect actual DB column names)

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  primary_role: string | null;
  is_super_admin: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserOrganization {
  user_id: string;
  organization_id: string;
  role: string;
  joined_at: Date;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface UserRole {
  user_id: string;
  role_id: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface Domain {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon?: string | null;
}

export interface LearningPath {
  id: string;
  slug: string;
  domain_id: string;
  name: string;
  title?: string; // alias
  description: string | null;
  target_role: string;
  estimated_hours: number | null;
  is_public: boolean;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  order_index?: number;
}

export interface Course {
  id: string;
  path_id: string;
  name?: string;
  title?: string; // alias
  slug?: string;
  description: string | null;
  level: string;
  order_index: number;
  is_public: boolean;
  estimated_duration?: number | null;
  created_by: string | null;
  created_at: Date;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  slug?: string;
  description: string | null;
  order_index: number;
  is_free: boolean;
  estimated_minutes: number | null;
  estimated_duration?: number | null;
  is_published: boolean;
  created_by: string | null;
  created_at: Date;
}

export interface ContentBlock {
  id: string;
  module_id: string;
  type: string;
  order_index: number;
  data?: any; // JSONB (original column)
  content?: string | null;
  metadata?: any | null;
  created_at: Date;
  updated_at?: Date;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  organization_id: string | null;
  source?: string | null;
  created_at?: Date;
}

export interface ModuleProgress {
  id: string;
  user_id: string;
  module_id: string;
  status?: string;
  progress_percent: number | null;
  started_at?: Date;
  completed_at: Date | null;
  last_position?: any | null;
}

export interface Assessment {
  id: string;
  module_id: string;
  title: string | null;
  config: any | null;
}

export interface Question {
  id: string;
  assessment_id: string;
  order_index: number;
  type: string;
  text: string;
  options: any | null;
  correct_answer: any | null;
}

export interface Attempt {
  id: string;
  assessment_id: string;
  user_id: string;
  started_at: Date;
  completed_at: Date | null;
  score: number | null;
  passed: boolean | null;
}

export interface Product {
  id: string;
  product_type: string;
  ref_id: string;
  name: string;
  description: string | null;
  currency: string;
  price_cents: number;
  is_active: boolean;
}

export interface Order {
  id: string;
  user_id: string;
  organization_id: string | null;
  total_amount_cents: number;
  currency: string;
  status: string;
  gateway: string;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  amount_cents: number;
}

export interface License {
  id: string;
  organization_id: string;
  product_id: string;
  seats: number;
  seats_used: number;
  valid_from: Date;
  valid_until: Date | null;
  created_at: Date;
}

export interface Event {
  id: string;
  user_id: string | null;
  organization_id: string | null;
  event_type: string;
  ref_id: string | null;
  metadata: any | null;
  occurred_at: Date;
}

// =============================================================================
// Risk Assessment & Template Generation Types
// =============================================================================

export type RiskTier = 'BASIC' | 'MODERATE' | 'HIGH';

export interface RiskAssessment {
  id: string;
  user_id: string;
  org_name: string; // Organization name
  q1_org_profile: string;
  q2_geography: string;
  q3_data_principals: string;
  q4_large_scale: string;
  q5_data_types: string;
  q6_purposes: string;
  q7_ai_use: string;
  q8_vendors: string;
  q9_cross_border: string;
  q10_volume: string;
  risk_tier: RiskTier;
  focus_areas: string[]; // JSON parsed
  sdf_flag: boolean;
  risk_drivers: string[]; // JSON parsed
  template_pack_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Artifact {
  id: string;
  artifact_id: string;
  name: string;
  description: string;
  category: string;
  min_risk_tier: RiskTier;
  applicable_risk_tiers: string[]; // JSON parsed
  applicable_focus_areas: string[]; // JSON parsed
  prompt_template_key: string;
  template_content?: string; // Optional: full template content for generation
  output_format: string;
  tags: string[]; // JSON parsed
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type DocumentStatus = 'draft' | 'edited' | 'generated' | 'exported';

export interface GeneratedDocument {
  id: string;
  user_id: string;
  title: string;
  assessment_id?: string;
  artifact_id: string;
  content: string;
  status: DocumentStatus;
  tone: string;
  jurisdiction: string;
  sector: string;
  conversation_id?: string; // NEW: Link to conversation
  creation_mode?: 'quick' | 'ai_assisted' | 'manual'; // NEW: How document was created
  ai_assisted_metadata?: any; // NEW: AI-related metadata (JSONB)
  created_at: Date;
  updated_at: Date;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI-Assisted Document Builder Types
// ═══════════════════════════════════════════════════════════════════════════

export type FieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'radio'
  | 'number'
  | 'email'
  | 'url'
  | 'checkbox';

export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex
  min?: number; // for number
  max?: number; // for number
  required?: boolean;
  customRule?: string;
}

export interface FieldDependency {
  fieldId: string;
  condition: 'equals' | 'notEquals' | 'includes' | 'notIncludes';
  value: any;
}

export interface TemplateField {
  fieldId: string;
  label: string;
  type: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: string[]; // For select/multiselect/radio
  validation?: FieldValidation;
  aiQuestion: string; // What AI should ask
  helpText?: string;
  dependsOn?: FieldDependency; // Conditional field
}

export interface AIInstructions {
  systemPrompt: string;
  contextToInclude?: string[]; // ["orgName", "assessmentTier", "previousSections"]
  tone?: 'professional' | 'simple' | 'technical' | 'friendly';
  examples?: Array<{
    userInput: string;
    expectedResponse: string;
  }>;
}

export interface TemplateSection {
  sectionId: string; // "section-1-overview"
  sectionNumber: number;
  title: string; // "Assessment Overview"
  emoji?: string; // "1️⃣"
  description?: string;
  estimatedTime?: string; // "2 min"
  fields: TemplateField[];
  outputTemplate: string; // Handlebars/mustache template for markdown generation
  aiInstructions?: AIInstructions;
  dependencies?: {
    // Section only shown if condition met
    requiresSection?: string;
    requiresField?: string;
    condition?: any;
  };
}

export interface TemplateStructure {
  sections: TemplateSection[];
  metadata?: {
    totalEstimatedTime?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    tags?: string[];
  };
}

export interface DocumentTemplate {
  id: string; // "vendor-risk-assessment"
  name: string; // "Vendor Risk Assessment Framework"
  description?: string;
  version: string;
  category: string; // "compliance", "governance", "policy"
  structure: TemplateStructure; // Full template structure
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ConversationStatus = 'active' | 'paused' | 'completed' | 'abandoned';

export interface ChatMessage {
  id: string;
  role: 'ai' | 'user' | 'system';
  content: string;
  timestamp: string;
  type?: 'intro' | 'question' | 'answer' | 'transition' | 'completion' | 'error';
  metadata?: {
    sectionId?: string;
    fieldId?: string;
    fieldValue?: any;
    [key: string]: any;
  };
}

export interface SectionAnswers {
  [sectionId: string]: {
    [fieldId: string]: any;
  };
}

export interface ConversationContext {
  orgName?: string;
  assessmentId?: string;
  assessmentTier?: string;
  templateId: string;
  documentId: string;
  [key: string]: any;
}

export interface DocumentConversation {
  id: string;
  user_id: string;
  document_id: string;
  template_id: string;
  assessment_id?: string;
  current_section_id?: string;
  current_section_index: number;
  current_field_id?: string;
  answers: SectionAnswers; // JSONB parsed
  completed_sections: string[];
  messages: ChatMessage[]; // JSONB parsed
  status: ConversationStatus;
  progress_percentage: number;
  context: ConversationContext; // JSONB parsed
  created_at: Date;
  updated_at: Date;
}

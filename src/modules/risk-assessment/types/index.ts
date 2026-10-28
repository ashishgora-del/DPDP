// Risk Assessment Module - TypeScript Type Definitions

export type RiskTier = 'BASIC' | 'MODERATE' | 'HIGH';

// Questionnaire Answers
export interface QuestionnaireAnswers {
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

// User Information
export interface User {
  orgName: string;
  email?: string;
}

// Assessment Data
export interface Assessment extends QuestionnaireAnswers {
  id: string;
  user: User;
  riskTier: RiskTier;
  focusAreas: string[];
  sdfFlag: boolean;
  riskDrivers: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Risk Calculation Result
export interface RiskCalculationResult {
  riskTier: RiskTier;
  focusAreas: string[];
  sdfFlag: boolean;
  riskDrivers: string[];
}

// Question Configuration
export interface QuestionOption {
  value: string;
  label: string;
  riskWeight?: number;
}

export interface Question {
  id: string;
  text: string;
  helpText?: string;
  options: QuestionOption[];
  type: 'radio' | 'checkbox' | 'select';
}

export interface QuestionnaireStep {
  step: number;
  title: string;
  subtitle: string;
  questions: Question[];
}

// Saved Progress
export interface SavedProgress {
  answers: Partial<QuestionnaireAnswers>;
  orgName: string;
  email: string;
  currentStep: number;
}

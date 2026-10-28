// DPDPA Risk Scoring Algorithm
import { QuestionnaireAnswers, RiskTier, RiskCalculationResult } from '../types';

export function calculateRiskTier(answers: QuestionnaireAnswers): RiskCalculationResult {
  let riskScore = 0;
  const focusAreas: string[] = [];
  const riskDrivers: string[] = [];
  let sdfFlag = false;

  // Q1: Organization Profile
  if (answers.q1_orgProfile === 'fintech' || 
      answers.q1_orgProfile === 'healthcare' || 
      answers.q1_orgProfile === 'edtech') {
    riskScore += 2;
    riskDrivers.push('High-risk sector (fintech/healthcare/edtech)');
  } else if (answers.q1_orgProfile === 'ecommerce' || answers.q1_orgProfile === 'saas') {
    riskScore += 1;
  }

  // Q2: Geography
  if (answers.q2_geography === 'pan-india' || 
      answers.q2_geography === 'multiple-states') {
    riskScore += 1;
    focusAreas.push('Multi-jurisdictional Compliance');
  } else if (answers.q2_geography === 'international') {
    riskScore += 2;
    focusAreas.push('Multi-jurisdictional Compliance');
    focusAreas.push('Cross-Border Transfer Compliance');
  }

  // Q3: Data Principals
  const principals = answers.q3_dataPrincipals.split(',');
  if (principals.includes('customers')) {
    focusAreas.push('Consent Management');
    riskScore += 1;
  }
  if (principals.includes('employees')) {
    focusAreas.push('Employee Data Governance');
  }
  if (principals.includes('children')) {
    riskScore += 3;
    riskDrivers.push('Processing children\'s data');
    focusAreas.push('Parental Consent & Children Safeguards');
  }

  // Q4: Large Scale Processing
  if (answers.q4_largeScale === 'yes') {
    riskScore += 2;
    sdfFlag = true;
    riskDrivers.push('Large-scale data processing');
    focusAreas.push('SDF Compliance & DPIA');
  } else if (answers.q4_largeScale === 'unsure') {
    riskScore += 1;
  }

  // Q5: Data Types
  const dataTypes = answers.q5_dataTypes.split(',');
  const sensitiveTypes = ['health', 'financial', 'biometric', 'genetic', 'religious', 'caste'];
  const hasSensitiveData = sensitiveTypes.some(type => dataTypes.includes(type));
  
  if (hasSensitiveData) {
    riskScore += 3;
    riskDrivers.push('Processing sensitive personal data');
    focusAreas.push('Sensitive Data Protection');
  }

  // Q6: Purposes
  const purposes = answers.q6_purposes.split(',');
  if (purposes.includes('profiling') || purposes.includes('automated-decision')) {
    riskScore += 2;
    riskDrivers.push('Automated decision-making and profiling');
    focusAreas.push('Automated Decision-Making Transparency');
  }
  if (purposes.includes('marketing')) {
    focusAreas.push('Marketing Consent');
  }

  // Q7: AI Use
  if (answers.q7_aiUse === 'yes') {
    riskScore += 2;
    riskDrivers.push('AI/ML usage in data processing');
    focusAreas.push('AI Governance & Algorithmic Transparency');
  } else if (answers.q7_aiUse === 'limited') {
    riskScore += 1;
    focusAreas.push('AI Governance & Algorithmic Transparency');
  }

  // Q8: Vendors/Third Parties
  if (answers.q8_vendors === 'multiple') {
    riskScore += 2;
    focusAreas.push('Data Processing Agreements (DPAs)');
  } else if (answers.q8_vendors === 'few') {
    riskScore += 1;
    focusAreas.push('Data Processing Agreements (DPAs)');
  }

  // Q9: Cross-border Transfers
  if (answers.q9_crossBorder === 'yes') {
    riskScore += 2;
    riskDrivers.push('Cross-border data transfers');
    if (!focusAreas.includes('Cross-Border Transfer Compliance')) {
      focusAreas.push('Cross-Border Transfer Compliance');
    }
  }

  // Q10: Volume
  if (answers.q10_volume === '>1m') {
    riskScore += 2;
    sdfFlag = true;
    if (!riskDrivers.includes('Large-scale data processing')) {
      riskDrivers.push('Large-scale data processing');
    }
    if (!focusAreas.includes('SDF Compliance & DPIA')) {
      focusAreas.push('SDF Compliance & DPIA');
    }
  } else if (answers.q10_volume === '100k-1m') {
    riskScore += 1;
  }

  // Determine risk tier
  let riskTier: RiskTier;
  if (riskScore <= 5) {
    riskTier = 'BASIC';
  } else if (riskScore <= 10) {
    riskTier = 'MODERATE';
  } else {
    riskTier = 'HIGH';
  }

  // Remove duplicates from focus areas
  const uniqueFocusAreas = [...new Set(focusAreas)];

  return {
    riskTier,
    focusAreas: uniqueFocusAreas,
    sdfFlag,
    riskDrivers,
  };
}

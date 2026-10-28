import { Template } from '../types/resources';

export const templates: Template[] = [
  // Basic Templates
  {
    id: '1',
    name: 'Privacy Notice Template',
    category: 'Privacy Documentation',
    riskTier: 'ALL',
    description: 'Standard privacy notice template compliant with DPDPA Section 5',
    fileUrl: '/templates/privacy-notice.docx',
  },
  {
    id: '2',
    name: 'Consent Form Template',
    category: 'Consent Management',
    riskTier: 'ALL',
    description: 'Basic consent collection form with granular purpose options',
    fileUrl: '/templates/consent-form.docx',
  },
  {
    id: '3',
    name: 'Data Retention Policy',
    category: 'Data Governance',
    riskTier: 'ALL',
    description: 'Policy template for data retention and deletion procedures',
    fileUrl: '/templates/retention-policy.docx',
  },
  {
    id: '4',
    name: 'Security Incident Response Plan',
    category: 'Security',
    riskTier: 'ALL',
    description: 'Framework for responding to data security incidents',
    fileUrl: '/templates/incident-response.docx',
  },
  {
    id: '5',
    name: 'Data Breach Notification Template',
    category: 'Compliance',
    riskTier: 'ALL',
    description: 'Template for notifying authorities and users of data breaches',
    fileUrl: '/templates/breach-notification.docx',
  },
  
  // Moderate Risk Templates
  {
    id: '6',
    name: 'Granular Consent Management Framework',
    category: 'Consent Management',
    riskTier: 'MODERATE',
    description: 'Advanced consent management with purpose-based controls',
    fileUrl: '/templates/consent-framework.docx',
  },
  {
    id: '7',
    name: 'Data Processing Agreement (DPA)',
    category: 'Vendor Management',
    riskTier: 'MODERATE',
    description: 'Template DPA for third-party data processors',
    fileUrl: '/templates/dpa-template.docx',
  },
  {
    id: '8',
    name: 'Vendor Risk Assessment Framework',
    category: 'Vendor Management',
    riskTier: 'MODERATE',
    description: 'Framework for assessing third-party vendor risks',
    fileUrl: '/templates/vendor-assessment.xlsx',
  },
  {
    id: '9',
    name: 'User Rights Request Procedures',
    category: 'Data Subject Rights',
    riskTier: 'MODERATE',
    description: 'Procedures for handling data access, correction, and deletion requests',
    fileUrl: '/templates/user-rights-procedures.docx',
  },
  
  // High Risk Templates
  {
    id: '10',
    name: 'Data Protection Impact Assessment (DPIA)',
    category: 'Risk Assessment',
    riskTier: 'HIGH',
    description: 'Comprehensive DPIA template for high-risk processing',
    fileUrl: '/templates/dpia-template.docx',
  },
  {
    id: '11',
    name: 'DPO Charter & Role Description',
    category: 'Governance',
    riskTier: 'HIGH',
    description: 'Charter and job description for Data Protection Officer',
    fileUrl: '/templates/dpo-charter.docx',
  },
  {
    id: '12',
    name: 'Cross-Border Transfer Documentation',
    category: 'Data Transfer',
    riskTier: 'HIGH',
    description: 'Documentation for cross-border data transfers',
    fileUrl: '/templates/cross-border-transfer.docx',
  },
  {
    id: '13',
    name: 'AI/ML Governance Framework',
    category: 'AI Governance',
    riskTier: 'HIGH',
    description: 'Framework for governing AI/ML data processing activities',
    fileUrl: '/templates/ai-governance.docx',
  },
  {
    id: '14',
    name: 'Children Data Protection Policy',
    category: 'Special Categories',
    riskTier: 'HIGH',
    description: "Policy for processing children's personal data",
    fileUrl: '/templates/children-data-policy.docx',
  },
  {
    id: '15',
    name: 'Sensitive Data Handling Procedures',
    category: 'Security',
    riskTier: 'HIGH',
    description: 'Procedures for handling sensitive personal data',
    fileUrl: '/templates/sensitive-data-procedures.docx',
  },
];

export const categories = [
  'All Categories',
  'Privacy Documentation',
  'Consent Management',
  'Data Governance',
  'Security',
  'Compliance',
  'Vendor Management',
  'Data Subject Rights',
  'Risk Assessment',
  'Governance',
  'Data Transfer',
  'AI Governance',
  'Special Categories',
];

export const riskTiers = ['All Tiers', 'BASIC', 'MODERATE', 'HIGH'];

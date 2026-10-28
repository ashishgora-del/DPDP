// Questionnaire Configuration - 10 Questions across 6 Steps
import { QuestionnaireStep } from '../types';

export const QUESTIONNAIRE_STEPS: QuestionnaireStep[] = [
  // Step 1: Organization Profile (Q1-Q2)
  {
    step: 1,
    title: 'Organization Profile',
    subtitle: 'Tell us about your organization',
    questions: [
      {
        id: 'q1_orgProfile',
        text: 'What best describes your organization?',
        helpText: 'Select the primary business category',
        type: 'radio',
        options: [
          { value: 'startup-tech', label: 'Startup / Tech Company' },
          { value: 'ecommerce', label: 'E-commerce / Retail', riskWeight: 1 },
          { value: 'fintech', label: 'Fintech / Financial Services', riskWeight: 2 },
          { value: 'healthcare', label: 'Healthcare / Telemedicine', riskWeight: 2 },
          { value: 'edtech', label: 'EdTech / Education', riskWeight: 2 },
          { value: 'saas', label: 'SaaS Platform', riskWeight: 1 },
          { value: 'other', label: 'Other' },
        ],
      },
      {
        id: 'q2_geography',
        text: 'What is your geographic scope of operations?',
        helpText: 'Where do you process personal data?',
        type: 'radio',
        options: [
          { value: 'single-city', label: 'Single city/region' },
          { value: 'single-state', label: 'Single state' },
          { value: 'multiple-states', label: 'Multiple states', riskWeight: 1 },
          { value: 'pan-india', label: 'Pan-India', riskWeight: 1 },
          { value: 'international', label: 'International operations', riskWeight: 2 },
        ],
      },
    ],
  },
  
  // Step 2: Data Principals (Q3-Q4)
  {
    step: 2,
    title: 'Data Principals',
    subtitle: 'Who are your data subjects?',
    questions: [
      {
        id: 'q3_dataPrincipals',
        text: 'Whose personal data do you process? (Select all that apply)',
        helpText: 'Check all categories of individuals',
        type: 'checkbox',
        options: [
          { value: 'customers', label: 'Customers / End Users', riskWeight: 1 },
          { value: 'employees', label: 'Employees' },
          { value: 'vendors', label: 'Vendors / Partners' },
          { value: 'children', label: 'Children (under 18)', riskWeight: 3 },
          { value: 'others', label: 'Others' },
        ],
      },
      {
        id: 'q4_largeScale',
        text: 'Do you process personal data on a large scale?',
        helpText: 'Generally >1 million individuals or significant systematic monitoring',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes', riskWeight: 2 },
          { value: 'no', label: 'No' },
          { value: 'unsure', label: 'Not sure', riskWeight: 1 },
        ],
      },
    ],
  },
  
  // Step 3: Nature of Data (Q5)
  {
    step: 3,
    title: 'Nature of Data',
    subtitle: 'What types of data do you collect?',
    questions: [
      {
        id: 'q5_dataTypes',
        text: 'What types of personal data do you collect? (Select all that apply)',
        helpText: 'Select all data categories you process',
        type: 'checkbox',
        options: [
          { value: 'basic', label: 'Basic (name, email, phone)' },
          { value: 'demographic', label: 'Demographic (age, gender, location)' },
          { value: 'financial', label: 'Financial data', riskWeight: 3 },
          { value: 'health', label: 'Health/Medical data', riskWeight: 3 },
          { value: 'biometric', label: 'Biometric data', riskWeight: 3 },
          { value: 'genetic', label: 'Genetic data', riskWeight: 3 },
          { value: 'religious', label: 'Religious beliefs', riskWeight: 3 },
          { value: 'caste', label: 'Caste/tribe information', riskWeight: 3 },
          { value: 'behavioral', label: 'Behavioral/usage data', riskWeight: 1 },
        ],
      },
    ],
  },
  
  // Step 4: Purpose & Automation (Q6-Q7)
  {
    step: 4,
    title: 'Purpose & Automation',
    subtitle: 'How do you use personal data?',
    questions: [
      {
        id: 'q6_purposes',
        text: 'For what purposes do you process personal data? (Select all that apply)',
        helpText: 'Select all applicable processing purposes',
        type: 'checkbox',
        options: [
          { value: 'service-delivery', label: 'Service delivery / Product fulfillment' },
          { value: 'customer-support', label: 'Customer support' },
          { value: 'marketing', label: 'Marketing / Promotional communications', riskWeight: 1 },
          { value: 'analytics', label: 'Analytics / Performance monitoring', riskWeight: 1 },
          { value: 'profiling', label: 'Profiling / Personalization', riskWeight: 2 },
          { value: 'automated-decision', label: 'Automated decision-making', riskWeight: 2 },
          { value: 'research', label: 'Research & Development', riskWeight: 1 },
        ],
      },
      {
        id: 'q7_aiUse',
        text: 'Do you use AI/ML models to process personal data?',
        helpText: 'Includes automated profiling, recommendations, predictions',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes, extensively', riskWeight: 2 },
          { value: 'limited', label: 'Yes, limited use', riskWeight: 1 },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },
  
  // Step 5: Data Sharing (Q8-Q9)
  {
    step: 5,
    title: 'Data Sharing',
    subtitle: 'Do you share data with third parties?',
    questions: [
      {
        id: 'q8_vendors',
        text: 'Do you share personal data with third-party vendors or data processors?',
        helpText: 'E.g., cloud providers, payment processors, analytics tools',
        type: 'radio',
        options: [
          { value: 'no', label: 'No' },
          { value: 'few', label: 'Yes, 1-5 vendors', riskWeight: 1 },
          { value: 'multiple', label: 'Yes, 6+ vendors', riskWeight: 2 },
        ],
      },
      {
        id: 'q9_crossBorder',
        text: 'Do you transfer personal data outside India?',
        helpText: 'Cross-border data transfers to other countries',
        type: 'radio',
        options: [
          { value: 'yes', label: 'Yes', riskWeight: 2 },
          { value: 'no', label: 'No' },
        ],
      },
    ],
  },
  
  // Step 6: Scale & Volume (Q10)
  {
    step: 6,
    title: 'Scale & Volume',
    subtitle: 'Final question about data scale',
    questions: [
      {
        id: 'q10_volume',
        text: 'Approximately how many individuals\' data do you process?',
        helpText: 'Total number of data subjects (customers, employees, etc.)',
        type: 'radio',
        options: [
          { value: '<10k', label: 'Less than 10,000' },
          { value: '10k-100k', label: '10,000 - 100,000' },
          { value: '100k-1m', label: '100,000 - 1,000,000', riskWeight: 1 },
          { value: '>1m', label: 'More than 1,000,000', riskWeight: 2 },
        ],
      },
    ],
  },
];

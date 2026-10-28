export interface ChecklistItem {
  id: string;
  category: string;
  title: string;
  description: string;
  priority: 'required' | 'recommended' | 'sdf-only';
}

export const CHECKLIST_CATEGORIES = [
  'Legal Foundations',
  'Notices & Consent',
  'Data Principal Rights',
  'Security & Governance',
  'Cross-Border Transfers',
  'SDF-Specific Requirements',
] as const;

export type ChecklistCategory = (typeof CHECKLIST_CATEGORIES)[number];

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  // ── Legal Foundations ──────────────────────────────────────────────────
  {
    id: 'legal-basis',
    category: 'Legal Foundations',
    title: 'Document lawful basis for all processing activities',
    description:
      'Identify and record the lawful basis (consent, legitimate use) for each processing activity under DPDPA Sections 6-9.',
    priority: 'required',
  },
  {
    id: 'ropa',
    category: 'Legal Foundations',
    title: 'Maintain Records of Processing Activities (ROPA)',
    description:
      'Keep an up-to-date register of all processing activities, purposes, data categories, and retention periods.',
    priority: 'required',
  },
  {
    id: 'dpia',
    category: 'Legal Foundations',
    title: 'Conduct Data Protection Impact Assessment (DPIA)',
    description:
      'Identify and mitigate risks for high-risk or large-scale processing activities before they commence.',
    priority: 'recommended',
  },

  // ── Notices & Consent ──────────────────────────────────────────────────
  {
    id: 'privacy-notice',
    category: 'Notices & Consent',
    title: 'Publish Privacy Notice',
    description:
      'Draft and publish a clear, plain-language Privacy Notice disclosing all processing purposes, as required by DPDPA.',
    priority: 'required',
  },
  {
    id: 'consent-mechanism',
    category: 'Notices & Consent',
    title: 'Implement consent collection mechanism',
    description:
      'Build granular, free, specific, and informed consent flows for all personal data collection points.',
    priority: 'required',
  },
  {
    id: 'consent-withdrawal',
    category: 'Notices & Consent',
    title: 'Enable consent withdrawal',
    description:
      'Provide Data Principals with an easy, accessible method to withdraw consent at any time.',
    priority: 'required',
  },
  {
    id: 'children-consent',
    category: 'Notices & Consent',
    title: 'Implement parental consent for minors',
    description:
      'Obtain verifiable parental or guardian consent before processing personal data of individuals under 18.',
    priority: 'required',
  },

  // ── Data Principal Rights ──────────────────────────────────────────────
  {
    id: 'right-access',
    category: 'Data Principal Rights',
    title: 'Enable right to access personal data',
    description:
      'Allow Data Principals to request and receive a summary of their personal data currently being processed.',
    priority: 'required',
  },
  {
    id: 'right-correction',
    category: 'Data Principal Rights',
    title: 'Enable right to correction and erasure',
    description:
      'Provide mechanisms for Data Principals to correct inaccurate data and request erasure upon consent withdrawal.',
    priority: 'required',
  },
  {
    id: 'right-grievance',
    category: 'Data Principal Rights',
    title: 'Set up grievance redressal mechanism',
    description:
      'Appoint a Grievance Officer and publish contact details. Resolve all complaints within 30 days.',
    priority: 'required',
  },
  {
    id: 'rights-workflow',
    category: 'Data Principal Rights',
    title: 'Rights request workflow (30-day SLA)',
    description:
      'Establish an internal process to route, track, and respond to Data Principal rights requests within 30 days.',
    priority: 'required',
  },

  // ── Security & Governance ──────────────────────────────────────────────
  {
    id: 'security-measures',
    category: 'Security & Governance',
    title: 'Implement technical and organisational security measures',
    description:
      'Deploy encryption, access controls, pseudonymisation, and other safeguards proportionate to the risk involved.',
    priority: 'required',
  },
  {
    id: 'breach-notification',
    category: 'Security & Governance',
    title: 'Breach notification process',
    description:
      'Establish a process to notify the Data Protection Board and affected Data Principals upon a personal data breach.',
    priority: 'required',
  },
  {
    id: 'vendor-agreements',
    category: 'Security & Governance',
    title: 'Data Processing Agreements with all processors',
    description:
      'Execute written agreements with all third-party data processors imposing DPDPA-equivalent obligations.',
    priority: 'required',
  },
  {
    id: 'dpo-appointment',
    category: 'Security & Governance',
    title: 'Appoint Data Protection Officer (DPO)',
    description:
      'Appoint a qualified DPO to oversee data protection compliance - mandatory for Significant Data Fiduciaries.',
    priority: 'sdf-only',
  },

  // ── Cross-Border Transfers ─────────────────────────────────────────────
  {
    id: 'cross-border-review',
    category: 'Cross-Border Transfers',
    title: 'Review all cross-border data transfer arrangements',
    description:
      'Map international data flows and assess compliance with DPDPA cross-border transfer restrictions.',
    priority: 'required',
  },
  {
    id: 'localization',
    category: 'Cross-Border Transfers',
    title: 'Assess data localisation requirements',
    description:
      'Determine if any processing activities are subject to mandatory data localisation orders under DPDPA.',
    priority: 'recommended',
  },

  // ── SDF-Specific Requirements ──────────────────────────────────────────
  {
    id: 'sdf-registration',
    category: 'SDF-Specific Requirements',
    title: 'Register with Data Protection Board as SDF',
    description:
      'Complete mandatory registration with the DPDPA Data Protection Board upon designation as a Significant Data Fiduciary.',
    priority: 'sdf-only',
  },
  {
    id: 'sdf-audit',
    category: 'SDF-Specific Requirements',
    title: 'Commission annual independent data audit',
    description:
      'Arrange an independent annual audit of processing activities, policies, and technical safeguards.',
    priority: 'sdf-only',
  },
  {
    id: 'sdf-dpia-annual',
    category: 'SDF-Specific Requirements',
    title: 'Annual DPIA for SDF',
    description:
      'Conduct and document annual Data Protection Impact Assessments as required for SDFs under DPDPA.',
    priority: 'sdf-only',
  },
];

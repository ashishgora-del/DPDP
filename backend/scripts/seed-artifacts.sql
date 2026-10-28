-- =============================================================================
-- Seed Artifacts Data
-- Version: 2.0.0
-- Total: 15 pre-configured document templates
-- Names match exactly with src/modules/risk-assessment/lib/templates-config.ts
-- Tier logic:
--   ALL (riskTier in frontend) → min_risk_tier BASIC, applicable = [BASIC, MODERATE, HIGH]
--   MODERATE                   → min_risk_tier MODERATE, applicable = [MODERATE, HIGH]
--   HIGH                       → min_risk_tier HIGH, applicable = [HIGH]
-- =============================================================================

-- Clear existing data
TRUNCATE TABLE artifacts CASCADE;

-- ─── ALL-TIER ARTIFACTS (show for BASIC, MODERATE, HIGH) ─────────────────────

-- 1. Privacy Notice Template
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'PRIVACY_NOTICE_TEMPLATE',
  'Privacy Notice Template',
  'Standard privacy notice template compliant with DPDPA Section 5',
  'Privacy Documentation',
  'BASIC',
  '["BASIC", "MODERATE", "HIGH"]'::jsonb,
  '["Privacy Notice", "Consent Management", "Data Collection"]'::jsonb,
  'CUSTOMER_PRIVACY_NOTICE',
  'markdown',
  '["Privacy", "Notice", "Transparency", "Customer"]'::jsonb,
  true
);

-- 2. Consent Form Template
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'CONSENT_FORM_TEMPLATE',
  'Consent Form Template',
  'Basic consent collection form with granular purpose options',
  'Consent Management',
  'BASIC',
  '["BASIC", "MODERATE", "HIGH"]'::jsonb,
  '["Consent Management", "User Rights", "Preference Management"]'::jsonb,
  'CUSTOMER_PRIVACY_NOTICE',
  'markdown',
  '["Consent", "Form", "User Rights"]'::jsonb,
  true
);

-- 3. Data Retention Policy
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'DATA_RETENTION_POLICY',
  'Data Retention Policy',
  'Policy template for data retention and deletion procedures',
  'Data Governance',
  'BASIC',
  '["BASIC", "MODERATE", "HIGH"]'::jsonb,
  '["Data Retention", "Data Deletion", "Lifecycle Management"]'::jsonb,
  'BREACH_RESPONSE_SOP',
  'markdown',
  '["Retention", "Deletion", "Lifecycle"]'::jsonb,
  true
);

-- 4. Security Incident Response Plan
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'SECURITY_INCIDENT_RESPONSE_PLAN',
  'Security Incident Response Plan',
  'Framework for responding to data security incidents',
  'Security',
  'BASIC',
  '["BASIC", "MODERATE", "HIGH"]'::jsonb,
  '["Breach Response", "Incident Management", "Security"]'::jsonb,
  'BREACH_RESPONSE_SOP',
  'markdown',
  '["Breach", "Incident", "Security", "Response"]'::jsonb,
  true
);

-- 5. Data Breach Notification Template
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'DATA_BREACH_NOTIFICATION_TEMPLATE',
  'Data Breach Notification Template',
  'Template for notifying authorities and users of data breaches',
  'Compliance',
  'BASIC',
  '["BASIC", "MODERATE", "HIGH"]'::jsonb,
  '["Breach Response", "Compliance", "Notification"]'::jsonb,
  'BREACH_RESPONSE_SOP',
  'markdown',
  '["Breach", "Notification", "Compliance"]'::jsonb,
  true
);

-- ─── MODERATE-TIER ARTIFACTS (show for MODERATE, HIGH) ───────────────────────

-- 6. Granular Consent Management Framework
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'GRANULAR_CONSENT_MANAGEMENT_FRAMEWORK',
  'Granular Consent Management Framework',
  'Advanced consent management with purpose-based controls',
  'Consent Management',
  'MODERATE',
  '["MODERATE", "HIGH"]'::jsonb,
  '["Consent Management", "User Rights", "Preference Management"]'::jsonb,
  'CUSTOMER_PRIVACY_NOTICE',
  'markdown',
  '["Consent", "User Rights", "Preferences"]'::jsonb,
  true
);

-- 7. Data Processing Agreement (DPA)
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'DATA_PROCESSING_AGREEMENT',
  'Data Processing Agreement (DPA)',
  'Template DPA for third-party data processors',
  'Vendor Management',
  'MODERATE',
  '["MODERATE", "HIGH"]'::jsonb,
  '["Vendor Management", "Third-Party Risk", "Data Processing"]'::jsonb,
  'VENDOR_DPA_ADDENDUM',
  'markdown',
  '["Vendor", "DPA", "Contract", "Third-Party"]'::jsonb,
  true
);

-- 8. Vendor Risk Assessment Framework
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'VENDOR_RISK_ASSESSMENT_FRAMEWORK',
  'Vendor Risk Assessment Framework',
  'Framework for assessing third-party vendor risks',
  'Vendor Management',
  'MODERATE',
  '["MODERATE", "HIGH"]'::jsonb,
  '["Vendor Management", "Third-Party Risk", "Risk Assessment"]'::jsonb,
  'VENDOR_DPA_ADDENDUM',
  'markdown',
  '["Vendor", "Risk", "Assessment", "Third-Party"]'::jsonb,
  true
);

-- 9. User Rights Request Procedures
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'USER_RIGHTS_REQUEST_PROCEDURES',
  'User Rights Request Procedures',
  'Procedures for handling data access, correction, and deletion requests',
  'Data Subject Rights',
  'MODERATE',
  '["MODERATE", "HIGH"]'::jsonb,
  '["User Rights", "Data Access", "Data Deletion"]'::jsonb,
  'CUSTOMER_PRIVACY_NOTICE',
  'markdown',
  '["User Rights", "DSAR", "Access", "Deletion"]'::jsonb,
  true
);

-- ─── HIGH-TIER ARTIFACTS (show for HIGH only) ────────────────────────────────

-- 10. Data Protection Impact Assessment (DPIA)
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'DATA_PROTECTION_IMPACT_ASSESSMENT',
  'Data Protection Impact Assessment (DPIA)',
  'Comprehensive DPIA template for high-risk processing',
  'Risk Assessment',
  'HIGH',
  '["HIGH"]'::jsonb,
  '["AI/ML Governance", "Risk Assessment", "Automated Decision Making"]'::jsonb,
  'DPIA_ASSESSMENT',
  'markdown',
  '["DPIA", "Risk", "Assessment"]'::jsonb,
  true
);

-- 11. DPO Charter & Role Description
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'DPO_CHARTER_ROLE_DESCRIPTION',
  'DPO Charter & Role Description',
  'Charter and job description for Data Protection Officer',
  'Governance',
  'HIGH',
  '["HIGH"]'::jsonb,
  '["DPO", "Governance", "Organizational Structure"]'::jsonb,
  'CUSTOMER_PRIVACY_NOTICE',
  'markdown',
  '["DPO", "Governance", "Role"]'::jsonb,
  true
);

-- 12. Cross-Border Transfer Documentation
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'CROSS_BORDER_TRANSFER_DOCUMENTATION',
  'Cross-Border Transfer Documentation',
  'Documentation for cross-border data transfers',
  'Data Transfer',
  'HIGH',
  '["HIGH"]'::jsonb,
  '["Cross-Border Transfers", "International Data", "Data Localization"]'::jsonb,
  'VENDOR_DPA_ADDENDUM',
  'markdown',
  '["International", "Transfer", "Cross-Border"]'::jsonb,
  true
);

-- 13. AI/ML Governance Framework
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'AI_ML_GOVERNANCE_FRAMEWORK',
  'AI/ML Governance Framework',
  'Framework for governing AI/ML data processing activities',
  'AI Governance',
  'HIGH',
  '["HIGH"]'::jsonb,
  '["AI/ML Governance", "Automated Decisions", "Algorithmic Transparency"]'::jsonb,
  'AI_AUTOMATED_DECISION',
  'markdown',
  '["AI", "ML", "Governance", "Framework"]'::jsonb,
  true
);

-- 14. Children Data Protection Policy
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'CHILDREN_DATA_PROTECTION_POLICY',
  'Children Data Protection Policy',
  'Policy for processing children''s personal data',
  'Special Categories',
  'HIGH',
  '["HIGH"]'::jsonb,
  '["Children Data", "Parental Consent", "Special Categories"]'::jsonb,
  'CHILDREN_DATA_SAFEGUARDS',
  'markdown',
  '["Children", "Parental Consent", "Minors"]'::jsonb,
  true
);

-- 15. Sensitive Data Handling Procedures
INSERT INTO artifacts (
  id, artifact_id, name, description, category,
  min_risk_tier, applicable_risk_tiers, applicable_focus_areas,
  prompt_template_key, output_format, tags, is_active
) VALUES (
  gen_random_uuid()::text,
  'SENSITIVE_DATA_HANDLING_PROCEDURES',
  'Sensitive Data Handling Procedures',
  'Procedures for handling sensitive personal data',
  'Security',
  'HIGH',
  '["HIGH"]'::jsonb,
  '["Sensitive Data", "Technical Safeguards", "Encryption"]'::jsonb,
  'BREACH_RESPONSE_SOP',
  'markdown',
  '["Sensitive", "Security", "Procedures"]'::jsonb,
  true
);

-- Verify insertion
SELECT COUNT(*) as total_artifacts FROM artifacts WHERE is_active = true;
SELECT min_risk_tier, COUNT(*) as count
FROM artifacts
WHERE is_active = true
GROUP BY min_risk_tier
ORDER BY min_risk_tier;

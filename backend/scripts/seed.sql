-- =============================================================================
-- Seed Data Script
-- Run with: psql $DATABASE_URL -f scripts/seed.sql
--           OR via: npm run db:seed
-- This script is idempotent (safe to run multiple times).
-- =============================================================================

-- --------------------------------------------------------
-- 1. ROLES
-- --------------------------------------------------------
INSERT INTO roles (id, name, description)
VALUES
  ('role-learner', 'LEARNER',  'Default role for all learners'),
  ('role-admin',   'ADMIN',    'Administrator with full platform access'),
  ('role-author',  'AUTHOR',   'Content author / course creator')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 2. ADMIN USER  (password: Admin@123)
--    bcrypt hash of 'Admin@123' with 10 salt rounds
-- --------------------------------------------------------
INSERT INTO users (id, email, password_hash, name, primary_role, is_super_admin, created_at, updated_at)
VALUES (
  'user-admin-seed',
  'admin@elearning.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
  'Admin User',
  'PRACTITIONER',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
VALUES ('user-admin-seed', 'role-admin')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------
-- 3. LEARNER TEST USER  (password: Learner@123)
-- --------------------------------------------------------
INSERT INTO users (id, email, password_hash, name, primary_role, is_super_admin, created_at, updated_at)
VALUES (
  'user-learner-seed',
  'learner@elearning.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Learner@123 (same hash for seeding)
  'Test Learner',
  'BEGINNER',
  FALSE,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
VALUES ('user-learner-seed', 'role-learner')
ON CONFLICT DO NOTHING;

-- --------------------------------------------------------
-- 4. DOMAINS
-- --------------------------------------------------------
INSERT INTO domains (id, slug, name, description, icon)
VALUES
  ('dom-compliance',  'compliance',   'Legal & Compliance',   'Legal frameworks and compliance requirements for data protection', '⚖️'),
  ('dom-technology',  'technology',   'Technology & AI',      'Technical aspects of AI systems and data engineering',            '🤖'),
  ('dom-governance',  'ai-governance','AI Governance',        'Policies, frameworks and oversight of AI systems',                '🏛️'),
  ('dom-ethics',      'ethics',       'AI Ethics',            'Ethical considerations in AI development and deployment',         '🌐')
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 5. LEARNING PATHS
-- --------------------------------------------------------
INSERT INTO learning_paths (id, slug, domain_id, name, description, target_role, estimated_hours, is_public, created_by, created_at, updated_at)
VALUES
  (
    'path-dpdpa-beginner',
    'dpdpa-beginners-guide',
    'dom-compliance',
    'DPDPA Beginners Guide',
    'A complete introduction to India''s Digital Personal Data Protection Act for non-technical professionals.',
    'BEGINNER',
    10,
    TRUE,
    'user-admin-seed',
    NOW(),
    NOW()
  ),
  (
    'path-ai-governance',
    'ai-governance-essentials',
    'dom-governance',
    'AI Governance Essentials',
    'Core principles and frameworks for governing AI systems responsibly.',
    'PRACTITIONER',
    8,
    TRUE,
    'user-admin-seed',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 6. COURSES
-- --------------------------------------------------------
INSERT INTO courses (id, path_id, title, description, level, order_index, is_public, created_by, created_at)
VALUES
  (
    'course-intro-dpdpa',
    'path-dpdpa-beginner',
    'Introduction to DPDPA',
    'Learn the fundamentals of India''s Digital Personal Data Protection Act.',
    'BEGINNER',
    0,
    TRUE,
    'user-admin-seed',
    NOW()
  ),
  (
    'course-dpdpa-obligations',
    'path-dpdpa-beginner',
    'Obligations Under DPDPA',
    'Understand the duties of data fiduciaries and data processors.',
    'INTERMEDIATE',
    1,
    TRUE,
    'user-admin-seed',
    NOW()
  ),
  (
    'course-ai-governance-101',
    'path-ai-governance',
    'AI Governance Fundamentals',
    'Introduction to AI governance frameworks and global standards.',
    'BEGINNER',
    0,
    TRUE,
    'user-admin-seed',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 7. MODULES
-- --------------------------------------------------------
INSERT INTO modules (id, course_id, title, description, order_index, is_free, estimated_minutes, is_published, created_by, created_at)
VALUES
  -- Intro to DPDPA – Module 1 (free)
  (
    'mod-what-is-dpdpa',
    'course-intro-dpdpa',
    'What is DPDPA?',
    'Overview of the Digital Personal Data Protection Act and its scope.',
    0, TRUE, 20, TRUE, 'user-admin-seed', NOW()
  ),
  -- Intro to DPDPA – Module 2
  (
    'mod-key-definitions',
    'course-intro-dpdpa',
    'Key Definitions',
    'Essential terms: personal data, data principal, data fiduciary, data processor.',
    1, FALSE, 25, TRUE, 'user-admin-seed', NOW()
  ),
  -- Intro to DPDPA – Module 3
  (
    'mod-rights-obligations',
    'course-intro-dpdpa',
    'Rights & Obligations',
    'Rights of data principals and obligations of data fiduciaries under DPDPA.',
    2, FALSE, 30, TRUE, 'user-admin-seed', NOW()
  ),
  -- Obligations course – Module 1 (free)
  (
    'mod-consent-framework',
    'course-dpdpa-obligations',
    'Consent Framework',
    'How to obtain, manage and withdraw consent under DPDPA.',
    0, TRUE, 30, TRUE, 'user-admin-seed', NOW()
  ),
  -- AI Governance – Module 1 (free)
  (
    'mod-ai-gov-intro',
    'course-ai-governance-101',
    'Introduction to AI Governance',
    'Why AI governance matters and the key global frameworks.',
    0, TRUE, 25, TRUE, 'user-admin-seed', NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- 8. CONTENT BLOCKS  (sample text blocks for free modules)
-- --------------------------------------------------------
INSERT INTO content_blocks (id, module_id, type, order_index, data, created_at)
VALUES
  (
    'cb-what-is-dpdpa-text',
    'mod-what-is-dpdpa',
    'TEXT',
    0,
    '{"content": "# What is DPDPA?\n\nThe Digital Personal Data Protection Act (DPDPA) 2023 is India''s landmark data protection legislation. It regulates the processing of digital personal data and establishes rights for individuals whose data is collected.\n\n## Key Highlights\n- Applies to all digital personal data processed in India\n- Establishes rights of Data Principals (individuals)\n- Creates obligations for Data Fiduciaries (organisations)\n- Introduces significant penalties for non-compliance"}',
    NOW()
  ),
  (
    'cb-what-is-dpdpa-video',
    'mod-what-is-dpdpa',
    'VIDEO',
    1,
    '{"src": "https://example.com/videos/intro-dpdpa.mp4", "thumbnail": "https://example.com/thumbnails/intro-dpdpa.jpg", "duration": 720}',
    NOW()
  ),
  (
    'cb-ai-gov-intro-text',
    'mod-ai-gov-intro',
    'TEXT',
    0,
    '{"content": "# AI Governance Fundamentals\n\nAI governance refers to the frameworks, policies and processes that ensure AI systems are developed and deployed responsibly.\n\n## Why It Matters\n- Prevents algorithmic bias and discrimination\n- Ensures accountability and transparency\n- Protects individual rights\n- Builds public trust in AI"}',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- Done
-- --------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE '✅ Seed data applied successfully.';
  RAISE NOTICE '   Admin:   admin@elearning.com  / Admin@123';
  RAISE NOTICE '   Learner: learner@elearning.com / Learner@123';
END $$;

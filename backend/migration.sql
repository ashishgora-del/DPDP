-- =============================================================================
-- FULL PRODUCTION MIGRATION
-- Project: DPDPA AI Privacy Platform
-- Last Updated: 2026-02-28
--
-- ✅ SAFE TO RUN ON:
--   • Fresh / empty databases (creates everything from scratch)
--   • Existing databases (all statements are IF NOT EXISTS / idempotent)
--
-- EXECUTION ORDER (dependency chain):
--   1. Enums
--   2. Base platform tables (users, courses, etc.)
--   3. Indexes & foreign keys for base tables
--   4. Risk / Template enums
--   5. risk_assessments, artifacts, generated_documents
--   6. projects + project_id on risk_assessments      ← Phase 1
--   7. project_artifact_selections                     ← Phase 2
--   8. project_checklist_items                         ← Phase 4
--   9. Artifact seed data (15 DPDPA templates)         ← Phase 1 reseed
--  10. Grants for cPanel DB user
--
-- NOTE: No PostgreSQL extensions required. UUIDs generated in application code.
-- =============================================================================


-- =============================================================================
-- SECTION 1: Base Platform Enums
-- Note: UUIDs are generated in application code, no extension required
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE "ContentBlockType" AS ENUM ('VIDEO', 'TEXT', 'QUIZ', 'DOWNLOAD', 'CODE_LAB', 'EXTERNAL_LINK');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ProductType" AS ENUM ('MODULE', 'COURSE', 'PATH', 'ORG_BUNDLE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- SECTION 2: Base Platform Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" TEXT,
    "primary_role" TEXT,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "billing_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_organizations" (
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "org_role" TEXT NOT NULL,
    CONSTRAINT "user_organizations_pkey" PRIMARY KEY ("user_id","organization_id")
);

CREATE TABLE IF NOT EXISTS "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_roles" (
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

CREATE TABLE IF NOT EXISTS "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "role_permissions" (
    "role_id" TEXT NOT NULL,
    "permission_id" TEXT NOT NULL,
    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("role_id","permission_id")
);

CREATE TABLE IF NOT EXISTS "domains" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "domains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "learning_paths" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "domain_id" TEXT,
    "created_by" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "learning_paths_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "courses" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "path_id" TEXT,
    "created_by" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "price" DECIMAL(10,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "modules" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "course_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "content_blocks" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "block_type" "ContentBlockType" NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "content" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "content_blocks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "enrollments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "module_progress" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "module_progress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "assessments" (
    "id" TEXT NOT NULL,
    "module_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passing_score" INTEGER NOT NULL DEFAULT 70,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "questions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "question_text" TEXT NOT NULL,
    "options" JSONB NOT NULL DEFAULT '[]',
    "correct_answer" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "attempts" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER,
    "passed" BOOLEAN,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_type" "ProductType" NOT NULL,
    "ref_id" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "orders" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "organization_id" TEXT,
    "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "licenses" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "seats" INTEGER NOT NULL DEFAULT 1,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "licenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "organization_id" TEXT,
    "event_type" TEXT NOT NULL,
    "ref_id" TEXT,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);


-- =============================================================================
-- SECTION 3: Base Platform Indexes & Foreign Keys
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key"                             ON "users"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "organizations_slug_key"                      ON "organizations"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "roles_name_key"                              ON "roles"("name");
CREATE UNIQUE INDEX IF NOT EXISTS "permissions_key_key"                         ON "permissions"("key");
CREATE UNIQUE INDEX IF NOT EXISTS "domains_slug_key"                            ON "domains"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "learning_paths_slug_key"                     ON "learning_paths"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_user_id_course_id_organization_id_key" ON "enrollments"("user_id", "course_id", "organization_id");
CREATE UNIQUE INDEX IF NOT EXISTS "module_progress_user_id_module_id_key"       ON "module_progress"("user_id", "module_id");

DO $$ BEGIN ALTER TABLE "user_organizations"  ADD CONSTRAINT "user_organizations_user_id_fkey"         FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "user_organizations"  ADD CONSTRAINT "user_organizations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")  ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "user_roles"          ADD CONSTRAINT "user_roles_user_id_fkey"                 FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "user_roles"          ADD CONSTRAINT "user_roles_role_id_fkey"                 FOREIGN KEY ("role_id")         REFERENCES "roles"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "role_permissions"    ADD CONSTRAINT "role_permissions_role_id_fkey"            FOREIGN KEY ("role_id")         REFERENCES "roles"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "role_permissions"    ADD CONSTRAINT "role_permissions_permission_id_fkey"      FOREIGN KEY ("permission_id")   REFERENCES "permissions"("id")    ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "learning_paths"      ADD CONSTRAINT "learning_paths_domain_id_fkey"            FOREIGN KEY ("domain_id")       REFERENCES "domains"("id")        ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "learning_paths"      ADD CONSTRAINT "learning_paths_created_by_fkey"           FOREIGN KEY ("created_by")      REFERENCES "users"("id")          ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "courses"             ADD CONSTRAINT "courses_path_id_fkey"                     FOREIGN KEY ("path_id")         REFERENCES "learning_paths"("id") ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "courses"             ADD CONSTRAINT "courses_created_by_fkey"                  FOREIGN KEY ("created_by")      REFERENCES "users"("id")          ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "modules"             ADD CONSTRAINT "modules_course_id_fkey"                   FOREIGN KEY ("course_id")       REFERENCES "courses"("id")        ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "modules"             ADD CONSTRAINT "modules_created_by_fkey"                  FOREIGN KEY ("created_by")      REFERENCES "users"("id")          ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "content_blocks"      ADD CONSTRAINT "content_blocks_module_id_fkey"            FOREIGN KEY ("module_id")       REFERENCES "modules"("id")        ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "enrollments"         ADD CONSTRAINT "enrollments_user_id_fkey"                 FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "enrollments"         ADD CONSTRAINT "enrollments_course_id_fkey"               FOREIGN KEY ("course_id")       REFERENCES "courses"("id")        ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "enrollments"         ADD CONSTRAINT "enrollments_organization_id_fkey"         FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")  ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "module_progress"     ADD CONSTRAINT "module_progress_user_id_fkey"             FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "module_progress"     ADD CONSTRAINT "module_progress_module_id_fkey"           FOREIGN KEY ("module_id")       REFERENCES "modules"("id")        ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "assessments"         ADD CONSTRAINT "assessments_module_id_fkey"               FOREIGN KEY ("module_id")       REFERENCES "modules"("id")        ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "questions"           ADD CONSTRAINT "questions_assessment_id_fkey"             FOREIGN KEY ("assessment_id")   REFERENCES "assessments"("id")    ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "attempts"            ADD CONSTRAINT "attempts_assessment_id_fkey"              FOREIGN KEY ("assessment_id")   REFERENCES "assessments"("id")    ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "attempts"            ADD CONSTRAINT "attempts_user_id_fkey"                    FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "orders"              ADD CONSTRAINT "orders_user_id_fkey"                      FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "orders"              ADD CONSTRAINT "orders_organization_id_fkey"              FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")  ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "order_items"         ADD CONSTRAINT "order_items_order_id_fkey"                FOREIGN KEY ("order_id")        REFERENCES "orders"("id")         ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "order_items"         ADD CONSTRAINT "order_items_product_id_fkey"              FOREIGN KEY ("product_id")      REFERENCES "products"("id")       ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "licenses"            ADD CONSTRAINT "licenses_organization_id_fkey"            FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")  ON DELETE CASCADE  ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "licenses"            ADD CONSTRAINT "licenses_product_id_fkey"                 FOREIGN KEY ("product_id")      REFERENCES "products"("id")       ON DELETE RESTRICT ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "events"              ADD CONSTRAINT "events_user_id_fkey"                      FOREIGN KEY ("user_id")         REFERENCES "users"("id")          ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE "events"              ADD CONSTRAINT "events_organization_id_fkey"              FOREIGN KEY ("organization_id") REFERENCES "organizations"("id")  ON DELETE SET NULL ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- =============================================================================
-- SECTION 4: Risk & Template Generation Enums
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE "RiskTier" AS ENUM ('BASIC', 'MODERATE', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'edited', 'generated', 'exported');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- SECTION 5: Risk Assessment & Template Tables
-- =============================================================================

CREATE TABLE IF NOT EXISTS "risk_assessments" (
    "id"                  TEXT        NOT NULL,
    "user_id"             TEXT        NOT NULL,
    "org_name"            TEXT        NOT NULL DEFAULT '',
    "q1_org_profile"      TEXT        NOT NULL,
    "q2_geography"        TEXT        NOT NULL,
    "q3_data_principals"  TEXT        NOT NULL,
    "q4_large_scale"      TEXT        NOT NULL,
    "q5_data_types"       TEXT        NOT NULL,
    "q6_purposes"         TEXT        NOT NULL,
    "q7_ai_use"           TEXT        NOT NULL,
    "q8_vendors"          TEXT        NOT NULL,
    "q9_cross_border"     TEXT        NOT NULL,
    "q10_volume"          TEXT        NOT NULL,
    "risk_tier"           "RiskTier"  NOT NULL,
    "focus_areas"         JSONB       NOT NULL DEFAULT '[]',
    "sdf_flag"            BOOLEAN     NOT NULL DEFAULT false,
    "risk_drivers"        JSONB       NOT NULL DEFAULT '[]',
    "template_pack_id"    TEXT,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "risk_assessments" ADD COLUMN IF NOT EXISTS "org_name" TEXT NOT NULL DEFAULT '';

DO $$ BEGIN
  ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "risk_assessments_user_id_idx"     ON "risk_assessments"("user_id");
CREATE INDEX IF NOT EXISTS "risk_assessments_risk_tier_idx"   ON "risk_assessments"("risk_tier");
CREATE INDEX IF NOT EXISTS "risk_assessments_created_at_idx"  ON "risk_assessments"("created_at" DESC);

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "artifacts" (
    "id"                     TEXT        NOT NULL,
    "artifact_id"            TEXT        NOT NULL UNIQUE,
    "name"                   TEXT        NOT NULL,
    "description"            TEXT        NOT NULL,
    "category"               TEXT        NOT NULL,
    "min_risk_tier"          "RiskTier"  NOT NULL,
    "applicable_risk_tiers"  JSONB       NOT NULL DEFAULT '[]',
    "applicable_focus_areas" JSONB       NOT NULL DEFAULT '[]',
    "prompt_template_key"    TEXT        NOT NULL,
    "output_format"          TEXT        NOT NULL DEFAULT 'markdown',
    "tags"                   JSONB       NOT NULL DEFAULT '[]',
    "is_active"              BOOLEAN     NOT NULL DEFAULT true,
    "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "artifacts_artifact_id_idx"   ON "artifacts"("artifact_id");
CREATE INDEX IF NOT EXISTS "artifacts_category_idx"      ON "artifacts"("category");
CREATE INDEX IF NOT EXISTS "artifacts_min_risk_tier_idx" ON "artifacts"("min_risk_tier");
CREATE INDEX IF NOT EXISTS "artifacts_is_active_idx"     ON "artifacts"("is_active");

-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "generated_documents" (
    "id"            TEXT             NOT NULL,
    "user_id"       TEXT             NOT NULL,
    "assessment_id" TEXT,
    "artifact_id"   TEXT,
    "title"         TEXT             NOT NULL DEFAULT '',
    "content"       TEXT             NOT NULL,
    "status"        "DocumentStatus" NOT NULL DEFAULT 'generated',
    "tone"          TEXT             NOT NULL DEFAULT 'formal',
    "jurisdiction"  TEXT             NOT NULL DEFAULT 'india',
    "sector"        TEXT             NOT NULL DEFAULT 'general',
    "created_at"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';

DO $$ BEGIN
  ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_assessment_id_fkey"
    FOREIGN KEY ("assessment_id") REFERENCES "risk_assessments"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "generated_documents_user_id_idx"       ON "generated_documents"("user_id");
CREATE INDEX IF NOT EXISTS "generated_documents_assessment_id_idx" ON "generated_documents"("assessment_id");
CREATE INDEX IF NOT EXISTS "generated_documents_artifact_id_idx"   ON "generated_documents"("artifact_id");
CREATE INDEX IF NOT EXISTS "generated_documents_status_idx"        ON "generated_documents"("status");
CREATE INDEX IF NOT EXISTS "generated_documents_created_at_idx"    ON "generated_documents"("created_at" DESC);

-- Prevent duplicate documents for same artifact + assessment combination
DO $$ BEGIN
  ALTER TABLE "generated_documents" ADD CONSTRAINT "generated_documents_artifact_assessment_unique"
    UNIQUE ("artifact_id", "assessment_id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- =============================================================================
-- SECTION 6: Projects Table  (Phase 1)
-- =============================================================================

CREATE TABLE IF NOT EXISTS projects (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id    ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Add project_id column to risk_assessments (links an assessment to a project)
-- CASCADE: deleting a project will also delete all its assessments (and their documents)
ALTER TABLE risk_assessments
  ADD COLUMN IF NOT EXISTS project_id TEXT REFERENCES projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_risk_assessments_project_id ON risk_assessments(project_id);


-- =============================================================================
-- SECTION 7: Project Artifact Selections  (Phase 2)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_artifact_selections (
  project_id  TEXT    NOT NULL REFERENCES projects(id)  ON DELETE CASCADE,
  artifact_id TEXT    NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  selected    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, artifact_id)
);

CREATE INDEX IF NOT EXISTS idx_pas_project_id ON project_artifact_selections(project_id);


-- =============================================================================
-- SECTION 8: Project Checklist Items  (Phase 4)
-- =============================================================================

CREATE TABLE IF NOT EXISTS project_checklist_items (
  project_id TEXT        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id    TEXT        NOT NULL,
  checked    BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_checklist_project_id ON project_checklist_items(project_id);


-- =============================================================================
-- SECTION 8.5: Compliance Attachments  (Phase 4 - Document Evidence)
-- =============================================================================

CREATE TABLE IF NOT EXISTS compliance_attachments (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  checklist_item_id TEXT NOT NULL,
  file_name         TEXT NOT NULL,
  file_data         TEXT NOT NULL,  -- base64 encoded file content
  file_size         INTEGER NOT NULL,
  file_type         TEXT NOT NULL,  -- MIME type
  uploaded_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_compliance_attachments_project 
  ON compliance_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_compliance_attachments_item 
  ON compliance_attachments(checklist_item_id);

COMMENT ON TABLE compliance_attachments IS 
  'Evidence documents attached to compliance checklist items';


-- =============================================================================
-- SECTION 9: Artifact Seed Data — 15 DPDPA Templates  (Phase 1 reseed)
-- Replaces older 12-template set. Safe to re-run (TRUNCATE ... CASCADE first).
-- Comment out this section if you want to preserve existing generated documents.
-- =============================================================================

-- TRUNCATE artifacts CASCADE;   ← Uncomment ONLY on a fresh install with no generated docs

-- Simple deterministic IDs based on artifact_id for idempotent seeding
INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_001', 'PRIVACY_NOTICE_TEMPLATE', 'Privacy Notice Template', 'Standard privacy notice template compliant with DPDPA Section 5', 'Privacy Documentation', 'BASIC', '["BASIC","MODERATE","HIGH"]'::jsonb, '["Privacy Notice","Consent Management","Data Collection"]'::jsonb, 'CUSTOMER_PRIVACY_NOTICE', 'markdown', '["Privacy","Notice","Transparency","Customer"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_002', 'CONSENT_FORM_TEMPLATE', 'Consent Form Template', 'Basic consent collection form with granular purpose options', 'Consent Management', 'BASIC', '["BASIC","MODERATE","HIGH"]'::jsonb, '["Consent Management","User Rights","Preference Management"]'::jsonb, 'CUSTOMER_PRIVACY_NOTICE', 'markdown', '["Consent","Form","User Rights"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_003', 'DATA_RETENTION_POLICY', 'Data Retention Policy', 'Policy template for data retention and deletion procedures', 'Data Governance', 'BASIC', '["BASIC","MODERATE","HIGH"]'::jsonb, '["Data Retention","Data Deletion","Lifecycle Management"]'::jsonb, 'BREACH_RESPONSE_SOP', 'markdown', '["Retention","Deletion","Lifecycle"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_004', 'SECURITY_INCIDENT_RESPONSE_PLAN', 'Security Incident Response Plan', 'Framework for responding to data security incidents', 'Security', 'BASIC', '["BASIC","MODERATE","HIGH"]'::jsonb, '["Breach Response","Incident Management","Security"]'::jsonb, 'BREACH_RESPONSE_SOP', 'markdown', '["Breach","Incident","Security","Response"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_005', 'DATA_BREACH_NOTIFICATION_TEMPLATE', 'Data Breach Notification Template', 'Template for notifying authorities and users of data breaches', 'Compliance', 'BASIC', '["BASIC","MODERATE","HIGH"]'::jsonb, '["Breach Response","Compliance","Notification"]'::jsonb, 'BREACH_RESPONSE_SOP', 'markdown', '["Breach","Notification","Compliance"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_006', 'GRANULAR_CONSENT_MANAGEMENT_FRAMEWORK', 'Granular Consent Management Framework', 'Advanced consent management with purpose-based controls', 'Consent Management', 'MODERATE', '["MODERATE","HIGH"]'::jsonb, '["Consent Management","User Rights","Preference Management"]'::jsonb, 'CUSTOMER_PRIVACY_NOTICE', 'markdown', '["Consent","User Rights","Preferences"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_007', 'DATA_PROCESSING_AGREEMENT', 'Data Processing Agreement (DPA)', 'Template DPA for third-party data processors', 'Vendor Management', 'MODERATE', '["MODERATE","HIGH"]'::jsonb, '["Vendor Management","Third-Party Risk","Data Processing"]'::jsonb, 'VENDOR_DPA_ADDENDUM', 'markdown', '["Vendor","DPA","Contract","Third-Party"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_008', 'VENDOR_RISK_ASSESSMENT_FRAMEWORK', 'Vendor Risk Assessment Framework', 'Framework for assessing third-party vendor risks', 'Vendor Management', 'MODERATE', '["MODERATE","HIGH"]'::jsonb, '["Vendor Management","Third-Party Risk","Risk Assessment"]'::jsonb, 'VENDOR_DPA_ADDENDUM', 'markdown', '["Vendor","Risk","Assessment","Third-Party"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_009', 'USER_RIGHTS_REQUEST_PROCEDURES', 'User Rights Request Procedures', 'Procedures for handling data access, correction, and deletion requests', 'Data Subject Rights', 'MODERATE', '["MODERATE","HIGH"]'::jsonb, '["User Rights","Data Access","Data Deletion"]'::jsonb, 'CUSTOMER_PRIVACY_NOTICE', 'markdown', '["User Rights","DSAR","Access","Deletion"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_010', 'DATA_PROTECTION_IMPACT_ASSESSMENT', 'Data Protection Impact Assessment (DPIA)', 'Comprehensive DPIA template for high-risk processing', 'Risk Assessment', 'HIGH', '["HIGH"]'::jsonb, '["AI/ML Governance","Risk Assessment","Automated Decision Making"]'::jsonb, 'DPIA_ASSESSMENT', 'markdown', '["DPIA","Risk","Assessment"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_011', 'DPO_CHARTER_ROLE_DESCRIPTION', 'DPO Charter & Role Description', 'Charter and job description for Data Protection Officer', 'Governance', 'HIGH', '["HIGH"]'::jsonb, '["DPO","Governance","Organizational Structure"]'::jsonb, 'CUSTOMER_PRIVACY_NOTICE', 'markdown', '["DPO","Governance","Role"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_012', 'CROSS_BORDER_TRANSFER_DOCUMENTATION', 'Cross-Border Transfer Documentation', 'Documentation for cross-border data transfers', 'Data Transfer', 'HIGH', '["HIGH"]'::jsonb, '["Cross-Border Transfers","International Data","Data Localization"]'::jsonb, 'VENDOR_DPA_ADDENDUM', 'markdown', '["International","Transfer","Cross-Border"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_013', 'AI_ML_GOVERNANCE_FRAMEWORK', 'AI/ML Governance Framework', 'Framework for governing AI/ML data processing activities', 'AI Governance', 'HIGH', '["HIGH"]'::jsonb, '["AI/ML Governance","Automated Decisions","Algorithmic Transparency"]'::jsonb, 'AI_AUTOMATED_DECISION', 'markdown', '["AI","ML","Governance","Framework"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_014', 'CHILDREN_DATA_PROTECTION_POLICY', 'Children Data Protection Policy', 'Policy for processing children''s personal data', 'Special Categories', 'HIGH', '["HIGH"]'::jsonb, '["Children Data","Parental Consent","Special Categories"]'::jsonb, 'CHILDREN_DATA_SAFEGUARDS', 'markdown', '["Children","Parental Consent","Minors"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;

INSERT INTO artifacts (id, artifact_id, name, description, category, min_risk_tier, applicable_risk_tiers, applicable_focus_areas, prompt_template_key, output_format, tags, is_active)
VALUES ('art_015', 'SENSITIVE_DATA_HANDLING_PROCEDURES', 'Sensitive Data Handling Procedures', 'Procedures for handling sensitive personal data', 'Security', 'HIGH', '["HIGH"]'::jsonb, '["Sensitive Data","Technical Safeguards","Encryption"]'::jsonb, 'BREACH_RESPONSE_SOP', 'markdown', '["Sensitive","Security","Procedures"]'::jsonb, true)
ON CONFLICT (artifact_id) DO UPDATE SET name=EXCLUDED.name, description=EXCLUDED.description, applicable_risk_tiers=EXCLUDED.applicable_risk_tiers, is_active=true;


-- =============================================================================
-- SECTION 10: AI-Assisted Document Builder Tables
-- Date: 2026-03-01
-- Description: Add tables for conversational AI-assisted document generation
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: document_templates
-- Stores template structures for AI-assisted document generation
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "document_templates" (
    "id"          TEXT         NOT NULL,  -- e.g., "vendor-risk-assessment"
    "name"        TEXT         NOT NULL,  -- e.g., "Vendor Risk Assessment Framework"
    "description" TEXT,
    "version"     TEXT         NOT NULL DEFAULT '1.0',
    "category"    TEXT         NOT NULL DEFAULT 'compliance',  -- compliance, governance, policy
    "structure"   JSONB        NOT NULL,  -- Full template structure (sections, fields, etc.)
    "is_active"   BOOLEAN      NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "document_templates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "document_templates_category_idx" ON "document_templates"("category");
CREATE INDEX IF NOT EXISTS "document_templates_is_active_idx" ON "document_templates"("is_active");

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: document_conversations
-- Stores conversation state for AI-assisted document generation
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "document_conversations" (
    "id"                     TEXT         NOT NULL,
    "user_id"                TEXT         NOT NULL,
    "document_id"            TEXT         NOT NULL,  -- Links to generated_documents
    "template_id"            TEXT         NOT NULL,  -- Links to document_templates
    "assessment_id"          TEXT,                   -- Optional: Links to risk_assessments
    
    -- Current state in conversation
    "current_section_id"     TEXT,                   -- e.g., "section-3-service-description"
    "current_section_index"  INTEGER      NOT NULL DEFAULT 0,
    "current_field_id"       TEXT,                   -- e.g., "service_description"
    
    -- Collected data
    "answers"                JSONB        NOT NULL DEFAULT '{}',  -- All answers by section
    "completed_sections"     TEXT[]       NOT NULL DEFAULT '{}',  -- Array of completed section IDs
    
    -- Chat history
    "messages"               JSONB        NOT NULL DEFAULT '[]',  -- Array of message objects
    
    -- Status tracking
    "status"                 TEXT         NOT NULL DEFAULT 'active',  -- active | paused | completed | abandoned
    "progress_percentage"    INTEGER      NOT NULL DEFAULT 0,
    
    -- Context
    "context"                JSONB        NOT NULL DEFAULT '{}',  -- orgName, assessmentTier, etc.
    
    "created_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"             TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "document_conversations_pkey" PRIMARY KEY ("id")
);

-- Foreign key constraints
DO $$ BEGIN
    ALTER TABLE "document_conversations" 
        ADD CONSTRAINT "document_conversations_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "document_conversations" 
        ADD CONSTRAINT "document_conversations_document_id_fkey"
        FOREIGN KEY ("document_id") REFERENCES "generated_documents"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "document_conversations" 
        ADD CONSTRAINT "document_conversations_template_id_fkey"
        FOREIGN KEY ("template_id") REFERENCES "document_templates"("id") ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE "document_conversations" 
        ADD CONSTRAINT "document_conversations_assessment_id_fkey"
        FOREIGN KEY ("assessment_id") REFERENCES "risk_assessments"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "document_conversations_user_id_idx" ON "document_conversations"("user_id");
CREATE INDEX IF NOT EXISTS "document_conversations_document_id_idx" ON "document_conversations"("document_id");
CREATE INDEX IF NOT EXISTS "document_conversations_template_id_idx" ON "document_conversations"("template_id");
CREATE INDEX IF NOT EXISTS "document_conversations_status_idx" ON "document_conversations"("status");
CREATE INDEX IF NOT EXISTS "document_conversations_created_at_idx" ON "document_conversations"("created_at" DESC);

-- Ensure one active conversation per document
CREATE UNIQUE INDEX IF NOT EXISTS "document_conversations_document_active_idx" 
    ON "document_conversations"("document_id") 
    WHERE "status" = 'active';

-- ─────────────────────────────────────────────────────────────────────────────
-- Update generated_documents table to link with conversations
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "generated_documents" 
    ADD COLUMN IF NOT EXISTS "conversation_id" TEXT;

ALTER TABLE "generated_documents" 
    ADD COLUMN IF NOT EXISTS "creation_mode" TEXT NOT NULL DEFAULT 'quick';  -- quick | ai_assisted | manual

ALTER TABLE "generated_documents" 
    ADD COLUMN IF NOT EXISTS "ai_assisted_metadata" JSONB;

-- Add foreign key for conversation_id
DO $$ BEGIN
    ALTER TABLE "generated_documents" 
        ADD CONSTRAINT "generated_documents_conversation_id_fkey"
        FOREIGN KEY ("conversation_id") REFERENCES "document_conversations"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "generated_documents_conversation_id_idx" 
    ON "generated_documents"("conversation_id");

CREATE INDEX IF NOT EXISTS "generated_documents_creation_mode_idx" 
    ON "generated_documents"("creation_mode");

-- Comments for documentation
COMMENT ON TABLE "document_templates" IS 'Template structures for AI-assisted document generation';
COMMENT ON TABLE "document_conversations" IS 'Conversation state for AI-assisted document generation sessions';
COMMENT ON COLUMN "document_conversations"."answers" IS 'All answers organized by section: {"section-1-overview": {"field": "value"}}';
COMMENT ON COLUMN "document_conversations"."messages" IS 'Chat history: [{"id", "role", "content", "timestamp", "metadata"}]';
COMMENT ON COLUMN "document_conversations"."status" IS 'active: in progress, paused: temporarily stopped, completed: finished, abandoned: user left';

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: Vendor Risk Assessment Template
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO "document_templates" (id, name, description, version, category, structure, is_active, created_at, updated_at)
VALUES (
  'vendor-risk-assessment',
  'Vendor Risk Assessment Framework',
  'Comprehensive vendor risk assessment template for DPDP Act 2023 compliance',
  '1.0',
  'compliance',
  '{"sections":[{"sectionId":"section-1-overview","sectionNumber":1,"title":"Assessment Overview","emoji":"1️⃣","description":"Evaluate whether a vendor processing personal data meets security and privacy requirements","estimatedTime":"2 min","fields":[{"fieldId":"assessment_name","label":"Assessment Name","type":"text","required":true,"placeholder":"e.g., CRM Vendor Review","aiQuestion":"What would you like to name this assessment?","validation":{"minLength":3,"maxLength":100}},{"fieldId":"assessment_date","label":"Assessment Date","type":"date","required":true,"aiQuestion":"What''s the assessment date? (Press Enter to use today''s date)","defaultValue":"today"},{"fieldId":"business_unit","label":"Business Unit Requesting Vendor","type":"text","required":true,"placeholder":"e.g., Customer Support","aiQuestion":"Which business unit is requesting this vendor?"},{"fieldId":"vendor_name","label":"Vendor Name","type":"text","required":true,"placeholder":"e.g., XYZ Technologies Pvt Ltd","aiQuestion":"What''s the vendor''s name?"},{"fieldId":"vendor_service_description","label":"Vendor Service Description","type":"textarea","required":true,"placeholder":"e.g., Customer support ticketing platform","aiQuestion":"Could you briefly describe what service this vendor provides?"}],"outputTemplate":"## 1️⃣ Assessment Overview\n\n**Purpose:** Evaluate whether a vendor processing personal data meets security and privacy requirements under DPDP Act 2023.\n\n| Field | Value |\n|-------|-------|\n| Assessment Name | {{assessment_name}} |\n| Assessment Date | {{assessment_date}} |\n| Business Unit | {{business_unit}} |\n| Vendor Name | {{vendor_name}} |\n| Service Description | {{vendor_service_description}} |\n\n","aiInstructions":{"systemPrompt":"You are helping a user complete a Vendor Risk Assessment under India''s DPDP Act 2023. Ask questions conversationally, one at a time. Be professional but friendly.","contextToInclude":["orgName","assessmentTier"],"tone":"professional"}},{"sectionId":"section-2-basic-info","sectionNumber":2,"title":"Vendor Basic Information","emoji":"2️⃣","description":"Legal and contact details of the vendor","estimatedTime":"3 min","fields":[{"fieldId":"vendor_legal_name","label":"Vendor Legal Name","type":"text","required":true,"aiQuestion":"What is the vendor''s legal/registered name?"},{"fieldId":"registered_address","label":"Registered Address","type":"textarea","required":true,"aiQuestion":"What''s the vendor''s registered address?"},{"fieldId":"country_of_operation","label":"Country of Operation","type":"text","required":true,"placeholder":"e.g., India","aiQuestion":"Which country does the vendor primarily operate from?"},{"fieldId":"website","label":"Website","type":"url","required":false,"placeholder":"https://example.com","aiQuestion":"What''s the vendor''s website? (Optional)"},{"fieldId":"primary_contact_name","label":"Primary Contact Name","type":"text","required":true,"aiQuestion":"Who is the primary contact person at the vendor?"},{"fieldId":"contact_email","label":"Contact Email","type":"email","required":true,"aiQuestion":"What''s their email address?"},{"fieldId":"contact_phone","label":"Contact Phone","type":"text","required":true,"aiQuestion":"And their phone number?"}],"outputTemplate":"## 2️⃣ Vendor Basic Information\n\n| Field | Value |\n|-------|-------|\n| Legal Name | {{vendor_legal_name}} |\n| Address | {{registered_address}} |\n| Country | {{country_of_operation}} |\n| Website | {{website}} |\n| Primary Contact | {{primary_contact_name}} |\n| Email | {{contact_email}} |\n| Phone | {{contact_phone}} |\n\n"},{"sectionId":"section-3-service-description","sectionNumber":3,"title":"Service Description","emoji":"3️⃣","description":"Purpose and nature of the vendor relationship","estimatedTime":"2 min","fields":[{"fieldId":"service_provided","label":"What service does the vendor provide?","type":"textarea","required":true,"aiQuestion":"Please describe in detail what service does the vendor provide to your organization?"},{"fieldId":"processes_personal_data","label":"Does the vendor process personal data on behalf of your organization?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor process personal data on behalf of your organization? (Yes/No)"},{"fieldId":"critical_to_business","label":"Is the service critical to business operations?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Is this service critical to your business operations? (Yes/No)"}],"outputTemplate":"## 3️⃣ Service Description\n\n**Purpose of Vendor Relationship**\n\n**Service Provided:** {{service_provided}}\n\n**Processes Personal Data:** {{processes_personal_data}}\n\n**Critical to Business:** {{critical_to_business}}\n\n"},{"sectionId":"section-4-personal-data","sectionNumber":4,"title":"Personal Data Processing","emoji":"4️⃣","description":"Categories and volume of personal data processed","estimatedTime":"3 min","fields":[{"fieldId":"data_categories","label":"Categories of Personal Data","type":"multiselect","required":true,"options":["Name","Email","Phone Number","Address","IP Address","Financial Data","Health Data","Biometric Data"],"aiQuestion":"Which categories of personal data will the vendor process? (You can select multiple)"},{"fieldId":"data_subjects","label":"Data Subjects","type":"multiselect","required":true,"options":["Customers","Employees","Vendors","Website Users"],"aiQuestion":"Whose data will be processed? (Select all that apply)"},{"fieldId":"data_volume","label":"Volume of Data","type":"radio","required":true,"options":["Less than 1,000 records","1,000 – 100,000","More than 100,000"],"aiQuestion":"What''s the expected volume of data records?"}],"outputTemplate":"## 4️⃣ Personal Data Processing\n\n**Categories of Personal Data:** {{data_categories}}\n\n**Data Subjects:** {{data_subjects}}\n\n**Volume:** {{data_volume}}\n\n"},{"sectionId":"section-5-purpose","sectionNumber":5,"title":"Purpose of Processing","emoji":"5️⃣","description":"Why the vendor needs the data","estimatedTime":"2 min","fields":[{"fieldId":"purpose_of_processing","label":"Purpose of Processing","type":"textarea","required":true,"placeholder":"e.g., Customer ticket resolution","aiQuestion":"Why does the vendor need to process this personal data? What''s the purpose?"},{"fieldId":"processing_activities","label":"Processing Activities","type":"textarea","required":true,"placeholder":"e.g., Storage, analysis, communication","aiQuestion":"What specific processing activities will be performed? (e.g., storage, analysis, sharing)"}],"outputTemplate":"## 5️⃣ Purpose of Processing\n\n**Purpose:** {{purpose_of_processing}}\n\n**Processing Activities:** {{processing_activities}}\n\n"},{"sectionId":"section-6-storage","sectionNumber":6,"title":"Data Storage & Location","emoji":"6️⃣","description":"Important for DPDP compliance regarding cross-border transfers","estimatedTime":"2 min","fields":[{"fieldId":"data_storage_location","label":"Where is the data stored?","type":"radio","required":true,"options":["India","Outside India","Both"],"aiQuestion":"Where will the data be stored? (India, Outside India, or Both)"},{"fieldId":"countries_list","label":"List Countries Where Data Is Stored","type":"text","required":true,"placeholder":"e.g., India, Singapore, USA","aiQuestion":"Please list the specific countries where data will be stored"},{"fieldId":"cross_border_transfer","label":"Is cross-border data transfer involved?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Is cross-border data transfer involved? (Yes/No)"}],"outputTemplate":"## 6️⃣ Data Storage & Location\n\n**Storage Location:** {{data_storage_location}}\n\n**Countries:** {{countries_list}}\n\n**Cross-border Transfer:** {{cross_border_transfer}}\n\n"},{"sectionId":"section-7-security","sectionNumber":7,"title":"Security Safeguards","emoji":"7️⃣","description":"Vendor must demonstrate reasonable security safeguards","estimatedTime":"4 min","fields":[{"fieldId":"encryption_at_rest","label":"Encryption at rest","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor use encryption at rest? (Yes/No)"},{"fieldId":"encryption_in_transit","label":"Encryption in transit","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor use encryption in transit? (Yes/No)"},{"fieldId":"multi_factor_authentication","label":"Multi-factor authentication","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Is multi-factor authentication implemented? (Yes/No)"},{"fieldId":"role_based_access","label":"Role-based access control","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Is role-based access control in place? (Yes/No)"},{"fieldId":"security_monitoring","label":"Security monitoring","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor have security monitoring systems? (Yes/No)"},{"fieldId":"backup_recovery","label":"Backup and disaster recovery","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Are backup and disaster recovery plans in place? (Yes/No)"},{"fieldId":"security_training","label":"Do employees receive security training?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Do vendor employees receive security training? (Yes/No)"},{"fieldId":"background_checks","label":"Are background checks conducted?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Are background checks conducted for vendor employees? (Yes/No)"},{"fieldId":"incident_response_plan","label":"Is there an incident response plan?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor have an incident response plan? (Yes/No)"},{"fieldId":"dedicated_security_team","label":"Is there a dedicated security team?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor have a dedicated security team? (Yes/No)"}],"outputTemplate":"## 7️⃣ Security Safeguards\n\n### Technical Controls\n\n| Control | Implemented |\n|---------|-------------|\n| Encryption at rest | {{encryption_at_rest}} |\n| Encryption in transit | {{encryption_in_transit}} |\n| Multi-factor authentication | {{multi_factor_authentication}} |\n| Role-based access control | {{role_based_access}} |\n| Security monitoring | {{security_monitoring}} |\n| Backup and disaster recovery | {{backup_recovery}} |\n\n### Organizational Controls\n\n| Control | Implemented |\n|---------|-------------|\n| Security training | {{security_training}} |\n| Background checks | {{background_checks}} |\n| Incident response plan | {{incident_response_plan}} |\n| Dedicated security team | {{dedicated_security_team}} |\n\n"},{"sectionId":"section-8-compliance","sectionNumber":8,"title":"Compliance & Certifications","emoji":"8️⃣","description":"Vendor compliance certifications","estimatedTime":"2 min","fields":[{"fieldId":"certifications","label":"Compliance Certifications","type":"multiselect","required":true,"options":["ISO 27001","SOC 2","PCI DSS","GDPR Compliance","None"],"aiQuestion":"Which compliance certifications does the vendor hold? (Select all that apply, or None)"}],"outputTemplate":"## 8️⃣ Compliance & Certifications\n\n**Certifications:** {{certifications}}\n\n"},{"sectionId":"section-9-subprocessors","sectionNumber":9,"title":"Sub-Processors","emoji":"9️⃣","description":"Does the vendor rely on other processors?","estimatedTime":"3 min","fields":[{"fieldId":"uses_subprocessors","label":"Uses Subprocessors?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor use any sub-processors (third parties)? (Yes/No)"},{"fieldId":"subprocessor_details","label":"Subprocessor Details","type":"textarea","required":false,"placeholder":"e.g., AWS | India | Cloud hosting\\nSendGrid | USA | Email delivery","aiQuestion":"Please list the sub-processors with format: Name | Country | Service (one per line)","dependsOn":{"fieldId":"uses_subprocessors","condition":"equals","value":"Yes"}}],"outputTemplate":"## 9️⃣ Sub-Processors\n\n**Uses Subprocessors:** {{uses_subprocessors}}\n\n{{#if subprocessor_details}}\n**Subprocessor Details:**\n\n{{subprocessor_details}}\n{{/if}}\n\n"},{"sectionId":"section-10-retention","sectionNumber":10,"title":"Data Retention","emoji":"🔟","description":"How long will data be retained?","estimatedTime":"2 min","fields":[{"fieldId":"retention_period","label":"How long will the vendor retain personal data?","type":"radio","required":true,"options":["< 30 days","30–90 days","90–365 days","1–3 years","> 3 years"],"aiQuestion":"How long will the vendor retain personal data?"},{"fieldId":"deletion_after_termination","label":"Does vendor delete data after contract termination?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Will the vendor delete all data after contract termination? (Yes/No)"}],"outputTemplate":"## 🔟 Data Retention\n\n**Retention Period:** {{retention_period}}\n\n**Deletion After Termination:** {{deletion_after_termination}}\n\n"},{"sectionId":"section-11-breach-notification","sectionNumber":11,"title":"Breach Notification","emoji":"1️⃣1️⃣","description":"Vendor breach reporting obligations","estimatedTime":"2 min","fields":[{"fieldId":"breach_detection","label":"Does vendor have breach detection mechanisms?","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Does the vendor have breach detection mechanisms in place? (Yes/No)"},{"fieldId":"breach_notification_timeline","label":"Breach notification timeline","type":"radio","required":true,"options":["Within 24 hours","Within 48 hours","Within 72 hours","More than 72 hours"],"aiQuestion":"Within what timeframe will the vendor notify you of a data breach?"}],"outputTemplate":"## 1️⃣1️⃣ Breach Notification\n\n**Breach Detection:** {{breach_detection}}\n\n**Notification Timeline:** {{breach_notification_timeline}}\n\n"},{"sectionId":"section-12-data-rights","sectionNumber":12,"title":"Data Principal Rights Support","emoji":"1️⃣2️⃣","description":"Vendor must support rights under DPDP","estimatedTime":"2 min","fields":[{"fieldId":"access_requests","label":"Data access requests supported","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Can the vendor support data access requests? (Yes/No)"},{"fieldId":"correction_supported","label":"Data correction supported","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Can the vendor support data correction requests? (Yes/No)"},{"fieldId":"deletion_supported","label":"Data deletion supported","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Can the vendor support data deletion requests? (Yes/No)"},{"fieldId":"consent_withdrawal","label":"Consent withdrawal supported","type":"radio","required":true,"options":["Yes","No"],"aiQuestion":"Can the vendor support consent withdrawal? (Yes/No)"}],"outputTemplate":"## 1️⃣2️⃣ Data Principal Rights Support\n\n| Right | Supported |\n|-------|----------|\n| Data access requests | {{access_requests}} |\n| Data correction | {{correction_supported}} |\n| Data deletion | {{deletion_supported}} |\n| Consent withdrawal | {{consent_withdrawal}} |\n\n"},{"sectionId":"section-13-risk-scoring","sectionNumber":13,"title":"Risk Scoring","emoji":"1️⃣3️⃣","description":"Automatic risk calculation based on responses","estimatedTime":"Auto-calculated","fields":[],"outputTemplate":"## 1️⃣3️⃣ Risk Scoring\n\n**Risk Score:** {{risk_score}} points\n\n**Risk Tier:** {{risk_tier}}\n\n### Score Breakdown\n\n{{risk_breakdown}}\n\n**Risk Level Guide:**\n- 0–5: LOW\n- 6–12: MODERATE\n- 13–20: HIGH\n- 21+: CRITICAL\n\n","aiInstructions":{"systemPrompt":"Calculate risk score based on previous answers. Sensitive data categories add 5 points, cross-border transfer adds 4, large data volume adds 3, no certification adds 2."}},{"sectionId":"section-14-outcome","sectionNumber":14,"title":"Risk Assessment Outcome","emoji":"1️⃣4️⃣","description":"Summary of the assessment","estimatedTime":"Auto-generated","fields":[],"outputTemplate":"## 1️⃣4️⃣ Risk Assessment Outcome\n\n**Vendor:** {{vendor_name}}\n\n**Service:** {{vendor_service_description}}\n\n**Personal Data Categories:** {{data_categories}}\n\n**Data Location:** {{countries_list}}\n\n**Risk Score:** {{risk_score}}\n\n**Risk Tier:** {{risk_tier}}\n\n"},{"sectionId":"section-15-approval","sectionNumber":15,"title":"Approval","emoji":"1️⃣5️⃣","description":"Final approval decision","estimatedTime":"2 min","fields":[{"fieldId":"privacy_team_review","label":"Privacy Team Review","type":"text","required":false,"placeholder":"Reviewed by...","aiQuestion":"Who from the Privacy Team reviewed this? (Optional)"},{"fieldId":"security_team_review","label":"Security Team Review","type":"text","required":false,"placeholder":"Reviewed by...","aiQuestion":"Who from the Security Team reviewed this? (Optional)"},{"fieldId":"approval_status","label":"Approval Status","type":"radio","required":true,"options":["Approved","Approved with conditions","Rejected"],"aiQuestion":"What''s the approval status? (Approved / Approved with conditions / Rejected)"},{"fieldId":"approval_conditions","label":"Conditions for Approval","type":"textarea","required":false,"placeholder":"List any conditions...","aiQuestion":"Are there any conditions for approval? (Optional)","dependsOn":{"fieldId":"approval_status","condition":"equals","value":"Approved with conditions"}},{"fieldId":"next_review_date","label":"Next Review Date","type":"date","required":true,"aiQuestion":"When should this vendor be reviewed again?"}],"outputTemplate":"## 1️⃣5️⃣ Approval\n\n| Field | Value |\n|-------|-------|\n| Privacy Team Review | {{privacy_team_review}} |\n| Security Team Review | {{security_team_review}} |\n| Approval Status | {{approval_status}} |\n| Next Review Date | {{next_review_date}} |\n\n{{#if approval_conditions}}\n**Conditions for Approval:**\n\n{{approval_conditions}}\n{{/if}}\n\n---\n\n*Assessment Context: {{context.orgName}} | Vendor: {{vendor_name}} | Risk Tier: {{risk_tier}} | Generated: {{assessment_date}}*\n"}],"metadata":{"totalEstimatedTime":"12-15 minutes","difficulty":"medium","tags":["vendor","risk-assessment","dpdp","compliance","security"]}}'::jsonb,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  version = EXCLUDED.version,
  structure = EXCLUDED.structure,
  is_active = EXCLUDED.is_active,
  updated_at = CURRENT_TIMESTAMP;


-- =============================================================================
-- SECTION 11: Grants for cPanel database user
-- =============================================================================

DO $$ BEGIN
  GRANT USAGE ON SCHEMA public TO "dymgcxar_AI_police_user";
  GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO "dymgcxar_AI_police_user";
  GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO "dymgcxar_AI_police_user";
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO "dymgcxar_AI_police_user";
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO "dymgcxar_AI_police_user";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================

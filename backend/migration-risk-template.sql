-- =============================================================================
-- Risk Assessment & Template Generation Migration
-- Version: 1.0.0
-- Date: 2026-02-27
-- Description: Adds tables for risk assessment and template generation
-- =============================================================================

-- Create ENUMs
DO $$ BEGIN
  CREATE TYPE "RiskTier" AS ENUM ('BASIC', 'MODERATE', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('draft', 'edited', 'generated', 'exported');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- Table: risk_assessments
-- Purpose: Store completed risk assessments from users
-- =============================================================================
CREATE TABLE IF NOT EXISTS "risk_assessments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "org_name" TEXT NOT NULL DEFAULT '',

    -- Questionnaire Responses (10 questions)
    "q1_org_profile" TEXT NOT NULL,
    "q2_geography" TEXT NOT NULL,
    "q3_data_principals" TEXT NOT NULL,
    "q4_large_scale" TEXT NOT NULL,
    "q5_data_types" TEXT NOT NULL,
    "q6_purposes" TEXT NOT NULL,
    "q7_ai_use" TEXT NOT NULL,
    "q8_vendors" TEXT NOT NULL,
    "q9_cross_border" TEXT NOT NULL,
    "q10_volume" TEXT NOT NULL,

    -- Calculated Results
    "risk_tier" "RiskTier" NOT NULL,
    "focus_areas" JSONB NOT NULL DEFAULT '[]',
    "sdf_flag" BOOLEAN NOT NULL DEFAULT false,
    "risk_drivers" JSONB NOT NULL DEFAULT '[]',
    "template_pack_id" TEXT,

    -- Metadata
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- Patch: add org_name if missing (safe to run multiple times)
ALTER TABLE "risk_assessments" ADD COLUMN IF NOT EXISTS "org_name" TEXT NOT NULL DEFAULT '';

-- Add foreign key to users
DO $$ BEGIN
  ALTER TABLE "risk_assessments"
    ADD CONSTRAINT "risk_assessments_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS "risk_assessments_user_id_idx" ON "risk_assessments"("user_id");
CREATE INDEX IF NOT EXISTS "risk_assessments_risk_tier_idx" ON "risk_assessments"("risk_tier");
CREATE INDEX IF NOT EXISTS "risk_assessments_created_at_idx" ON "risk_assessments"("created_at" DESC);

-- =============================================================================
-- Table: artifacts
-- Purpose: Catalog of available document templates
-- =============================================================================
CREATE TABLE IF NOT EXISTS "artifacts" (
    "id" TEXT NOT NULL,
    "artifact_id" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    
    -- Risk Tier Configuration
    "min_risk_tier" "RiskTier" NOT NULL,
    "applicable_risk_tiers" JSONB NOT NULL DEFAULT '[]',
    "applicable_focus_areas" JSONB NOT NULL DEFAULT '[]',
    
    -- Template Configuration
    "prompt_template_key" TEXT NOT NULL,
    "output_format" TEXT NOT NULL DEFAULT 'markdown',
    "tags" JSONB NOT NULL DEFAULT '[]',
    
    -- Status
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "artifacts_artifact_id_idx" ON "artifacts"("artifact_id");
CREATE INDEX IF NOT EXISTS "artifacts_category_idx" ON "artifacts"("category");
CREATE INDEX IF NOT EXISTS "artifacts_min_risk_tier_idx" ON "artifacts"("min_risk_tier");
CREATE INDEX IF NOT EXISTS "artifacts_is_active_idx" ON "artifacts"("is_active");

-- =============================================================================
-- Table: generated_documents
-- Purpose: Store AI-generated compliance documents
-- =============================================================================
CREATE TABLE IF NOT EXISTS "generated_documents" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "user_id" TEXT NOT NULL,
    "assessment_id" TEXT,  -- NULLABLE: Can generate without assessment
    "artifact_id" TEXT,    -- NULLABLE: Can be custom document without artifact

    -- Document Content
    "title" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'generated',

    -- Generation Parameters
    "tone" TEXT NOT NULL DEFAULT 'formal',
    "jurisdiction" TEXT NOT NULL DEFAULT 'india',
    "sector" TEXT NOT NULL DEFAULT 'general',

    -- Metadata
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generated_documents_pkey" PRIMARY KEY ("id")
);

-- Patch: add title column if missing (safe to run multiple times)
ALTER TABLE "generated_documents" ADD COLUMN IF NOT EXISTS "title" TEXT NOT NULL DEFAULT '';

-- Patch: ensure id column has a default uuid generator
ALTER TABLE "generated_documents" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;

-- Add foreign keys
DO $$ BEGIN
  ALTER TABLE "generated_documents"
    ADD CONSTRAINT "generated_documents_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "generated_documents"
    ADD CONSTRAINT "generated_documents_assessment_id_fkey"
    FOREIGN KEY ("assessment_id") REFERENCES "risk_assessments"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Add indexes
CREATE INDEX IF NOT EXISTS "generated_documents_user_id_idx" ON "generated_documents"("user_id");
CREATE INDEX IF NOT EXISTS "generated_documents_assessment_id_idx" ON "generated_documents"("assessment_id");
CREATE INDEX IF NOT EXISTS "generated_documents_artifact_id_idx" ON "generated_documents"("artifact_id");
CREATE INDEX IF NOT EXISTS "generated_documents_status_idx" ON "generated_documents"("status");
CREATE INDEX IF NOT EXISTS "generated_documents_created_at_idx" ON "generated_documents"("created_at" DESC);

-- =============================================================================
-- Migration Complete
-- =============================================================================

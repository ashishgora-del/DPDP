-- Migration: AI-Assisted Document Builder Tables
-- Date: 2026-03-01
-- Description: Add tables for conversational AI-assisted document generation

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

-- ─────────────────────────────────────────────────────────────────────────────
-- Comments for documentation
-- ─────────────────────────────────────────────────────────────────────────────

COMMENT ON TABLE "document_templates" IS 'Template structures for AI-assisted document generation';
COMMENT ON TABLE "document_conversations" IS 'Conversation state for AI-assisted document generation sessions';
COMMENT ON COLUMN "document_conversations"."answers" IS 'All answers organized by section: {"section-1-overview": {"field": "value"}}';
COMMENT ON COLUMN "document_conversations"."messages" IS 'Chat history: [{"id", "role", "content", "timestamp", "metadata"}]';
COMMENT ON COLUMN "document_conversations"."status" IS 'active: in progress, paused: temporarily stopped, completed: finished, abandoned: user left';

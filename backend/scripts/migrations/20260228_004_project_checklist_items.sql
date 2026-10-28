-- Phase 4: Compliance Checklist per project
-- Idempotent — safe to run multiple times
-- The PRIMARY KEY (project_id, item_id) implicitly indexes project_id lookups.

CREATE TABLE IF NOT EXISTS project_checklist_items (
  project_id  TEXT        NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_id     TEXT        NOT NULL,
  checked     BOOLEAN     NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, item_id)
);

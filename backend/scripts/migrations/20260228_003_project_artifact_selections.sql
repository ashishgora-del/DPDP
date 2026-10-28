CREATE TABLE IF NOT EXISTS project_artifact_selections (
  project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  artifact_id TEXT NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  selected    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, artifact_id)
);

CREATE INDEX IF NOT EXISTS idx_pas_project_id ON project_artifact_selections(project_id);

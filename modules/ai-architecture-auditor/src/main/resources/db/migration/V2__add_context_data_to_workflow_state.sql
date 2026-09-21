ALTER TABLE audit_workflow_state ADD COLUMN IF NOT EXISTS context_data JSONB;

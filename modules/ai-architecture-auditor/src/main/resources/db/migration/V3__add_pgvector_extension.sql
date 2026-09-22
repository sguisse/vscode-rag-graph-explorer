-- Flyway Migration V3: Safely enable pgvector extension if available on PostgreSQL host
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector') THEN
        CREATE EXTENSION IF NOT EXISTS vector;

        ALTER TABLE ai_architecture_auditor.audit_observation
        ADD COLUMN IF NOT EXISTS ast_embedding vector(384);

        ALTER TABLE ai_architecture_auditor.audit_finding
        ADD COLUMN IF NOT EXISTS finding_embedding vector(384);

        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_audit_observation_embedding ON ai_architecture_auditor.audit_observation USING hnsw (ast_embedding vector_cosine_ops)';
        EXECUTE 'CREATE INDEX IF NOT EXISTS idx_audit_finding_embedding ON ai_architecture_auditor.audit_finding USING hnsw (finding_embedding vector_cosine_ops)';
    ELSE
        RAISE NOTICE 'pgvector extension is not installed on this PostgreSQL server. Skipping vector embeddings.';
    END IF;
END $$;

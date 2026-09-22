-- Flyway Migration V2: Enable pgvector extension and add vector embedding columns for RASA
CREATE EXTENSION IF NOT EXISTS vector;

-- Add 384-dimensional vector embedding column to audit_observation table
ALTER TABLE ai_architecture_auditor.audit_observation
ADD COLUMN IF NOT EXISTS ast_embedding vector(384);

-- Add 384-dimensional vector embedding column to audit_finding table
ALTER TABLE ai_architecture_auditor.audit_finding
ADD COLUMN IF NOT EXISTS finding_embedding vector(384);

-- Create HNSW indexes for high-speed Cosine similarity vector search
CREATE INDEX IF NOT EXISTS idx_audit_observation_embedding
ON ai_architecture_auditor.audit_observation
USING hnsw (ast_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_audit_finding_embedding
ON ai_architecture_auditor.audit_finding
USING hnsw (finding_embedding vector_cosine_ops);
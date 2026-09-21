CREATE TABLE IF NOT EXISTS audit_workflow_state (
    run_id VARCHAR(64) PRIMARY KEY,
    current_state VARCHAR(64) NOT NULL,
    context_data JSONB,
    updated_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_observation (
    observation_id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    rule_id VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    payload_jsonb JSONB,
    snippet_hash VARCHAR(64) NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_obs_run_id ON audit_observation(run_id);
CREATE INDEX IF NOT EXISTS idx_obs_payload ON audit_observation USING gin(payload_jsonb);

CREATE TABLE IF NOT EXISTS audit_finding (
    finding_id VARCHAR(64) PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    rule_id VARCHAR(64) NOT NULL,
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    confidence DOUBLE PRECISION NOT NULL,
    status VARCHAR(64) NOT NULL,
    component VARCHAR(255) NOT NULL,
    payload_jsonb JSONB,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_finding_run_id ON audit_finding(run_id);

CREATE TABLE IF NOT EXISTS audit_token_metrics (
    id BIGSERIAL PRIMARY KEY,
    run_id VARCHAR(64) NOT NULL,
    model_name VARCHAR(128) NOT NULL,
    prompt_tokens INT NOT NULL,
    completion_tokens INT NOT NULL,
    latency_ms BIGINT NOT NULL,
    calculated_cost_usd DOUBLE PRECISION NOT NULL,
    created_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_metrics_run_id ON audit_token_metrics(run_id);
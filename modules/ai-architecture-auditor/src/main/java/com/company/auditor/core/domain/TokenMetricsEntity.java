package com.company.auditor.core.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "audit_token_metrics")
public class TokenMetricsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_id", length = 64, nullable = false)
    private String runId;

    @Column(name = "model_name", length = 128, nullable = false)
    private String modelName;

    @Column(name = "prompt_tokens", nullable = false)
    private int promptTokens;

    @Column(name = "completion_tokens", nullable = false)
    private int completionTokens;

    @Column(name = "latency_ms", nullable = false)
    private long latencyMs;

    @Column(name = "calculated_cost_usd", nullable = false)
    private double calculatedCostUsd;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    public TokenMetricsEntity() {}

    public TokenMetricsEntity(String runId, String modelName, int promptTokens, int completionTokens, long latencyMs, double calculatedCostUsd, long createdAt) {
        this.runId = runId;
        this.modelName = modelName;
        this.promptTokens = promptTokens;
        this.completionTokens = completionTokens;
        this.latencyMs = latencyMs;
        this.calculatedCostUsd = calculatedCostUsd;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public String getRunId() { return runId; }
    public String getModelName() { return modelName; }
    public int getPromptTokens() { return promptTokens; }
    public int getCompletionTokens() { return completionTokens; }
    public long getLatencyMs() { return latencyMs; }
    public double getCalculatedCostUsd() { return calculatedCostUsd; }
    public long getCreatedAt() { return createdAt; }
}
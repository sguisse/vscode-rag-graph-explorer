package com.company.auditor.core.llm;

import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.GraphSubTree;
import com.company.auditor.core.domain.Observation;

/**
 * LLM Triage Request record for observation and finding assessment (Story 3.3).
 */
public record AuditTriageRequest(
        String runId,
        Observation observation,
        GraphSubTree graphSubTree,
        Object extraContext,
        String findingId,
        String ruleId,
        String component,
        String description,
        Finding finding
) {
    public AuditTriageRequest(String runId, Observation observation, GraphSubTree graphSubTree, Object extraContext) {
        this(
                runId,
                observation,
                graphSubTree,
                extraContext,
                observation != null ? observation.observationId() : "unknown",
                observation != null ? observation.ruleId() : "RULE-000",
                observation != null && observation.location() != null ? observation.location().file() : "Unknown",
                observation != null ? observation.message() : "",
                null
        );
    }

    public AuditTriageRequest(Observation observation) {
        this(
                "run-default",
                observation,
                null,
                null,
                observation != null ? observation.observationId() : "unknown",
                observation != null ? observation.ruleId() : "RULE-000",
                observation != null && observation.location() != null ? observation.location().file() : "Unknown",
                observation != null ? observation.message() : "",
                null
        );
    }
}
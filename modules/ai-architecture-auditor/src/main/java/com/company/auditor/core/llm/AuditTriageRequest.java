package com.company.auditor.core.llm;

import com.company.auditor.core.domain.GraphSubTree;
import com.company.auditor.core.domain.Observation;

/**
 * Request payload for LLM grammar-guided triage evaluation.
 */
public record AuditTriageRequest(
    String runId,
    Observation observation,
    GraphSubTree graphContext,
    String systemPromptOverride
) {}
package com.company.auditor.core.llm;

/**
 * Structured response payload returned by LLM Gateway via grammar-guided JSON decoding.
 */
public record AuditTriageResponse(
    String observationId,
    boolean isTruePositive,
    double confidenceScore,
    String rationale,
    String suggestedRemediation,
    int promptTokens,
    int completionTokens,
    long executionTimeMs
) {}
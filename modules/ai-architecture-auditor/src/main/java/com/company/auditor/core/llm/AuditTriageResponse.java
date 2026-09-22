package com.company.auditor.core.llm;

/**
 * LLM Triage Response record for observation and finding assessment (Story 3.3).
 * Captures assessment outcomes, confidence metrics, remediation guidance, and token telemetry.
 */
public record AuditTriageResponse(
        String findingId,
        String assessment,
        double confidence,
        String reasoning,
        String suggestedFix,
        int promptTokens,
        int completionTokens,
        long executionTimeMs
) {
    public AuditTriageResponse(String findingId, String assessment, double confidence, String reasoning, String suggestedFix) {
        this(findingId, assessment, confidence, reasoning, suggestedFix, 150, 45, 120L);
    }

    public boolean isTruePositive() {
        return "CONFIRMED_VIOLATION".equalsIgnoreCase(assessment) || "TRUE_POSITIVE".equalsIgnoreCase(assessment);
    }

    public double confidenceScore() {
        return confidence;
    }
}
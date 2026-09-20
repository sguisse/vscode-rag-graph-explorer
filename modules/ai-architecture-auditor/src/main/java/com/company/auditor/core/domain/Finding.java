package com.company.auditor.core.domain;

import java.util.List;

/**
 * Validated architecture finding entity.
 */
public record Finding(
    String id,
    String ruleId,
    String category,
    Severity severity,
    double confidence,
    Status status,
    String component,
    List<Location> locations,
    List<EvidenceRef> evidence,
    String expected,
    String observed,
    String impact,
    String recommendation,
    ValidationResult validation
) {
    public enum Severity { CRITICAL, HIGH, MEDIUM, LOW, INFO }
    public enum Status { DETERMINISTIC_VERIFIED, EMPIRICALLY_VERIFIED, HEURISTICALLY_VALIDATED, UNCERTAIN, REJECTED, FALSE_POSITIVE_DISMISSED }

    public record EvidenceRef(String observationId, String detail) {}
    public record ValidationResult(String method, String detail, boolean reproducedDefect) {}
}
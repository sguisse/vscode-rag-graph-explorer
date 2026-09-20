package com.company.auditor.core.domain;

import java.util.Map;

/**
 * Immutable raw observation produced by static rules or parsers.
 */
public record Observation(
    String observationId,
    String ruleId,
    String severity,
    String message,
    Location location,
    Map<String, Object> attributes,
    long timestamp
) {}
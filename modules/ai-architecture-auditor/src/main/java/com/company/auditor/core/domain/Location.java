package com.company.auditor.core.domain;

/**
 * Immutable source code location tracking.
 */
public record Location(
    String file,
    int lineStart,
    int lineEnd,
    String symbol,
    String snippet
) {}
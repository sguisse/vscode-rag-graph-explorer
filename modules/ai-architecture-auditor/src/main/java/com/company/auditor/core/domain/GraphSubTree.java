package com.company.auditor.core.domain;

import java.util.List;
import java.util.Map;

/**
 * Minified graph context extracted via jQAssistant Graph RAG for LLM triage (Story 3.2).
 */
public record GraphSubTree(
        String fqn,
        int depth,
        List<Map<String, Object>> nodes,
        List<Map<String, Object>> relationships,
        int estimatedTokenCount
) {
    public String targetSymbol() {
        return fqn;
    }
}
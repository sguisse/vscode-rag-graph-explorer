package com.company.auditor.core.domain;

import java.util.List;
import java.util.Map;

/**
 * Minified graph context output for Graph RAG LLM queries.
 */
public record GraphSubTree(
    String targetSymbol,
    int hopDepth,
    List<Map<String, Object>> nodes,
    List<Map<String, Object>> edges,
    int estimatedTokenFootprint
) {}
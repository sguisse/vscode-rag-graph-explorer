package com.company.auditor.core.domain;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Graph Context Record representing jQAssistant / Neo4j AST graph topology metadata.
 */
public record GraphContext(
        String runId,
        int totalNodes,
        int totalEdges,
        Map<String, Set<String>> nodeAdjacencyMap,
        List<String> activeRuleIds
) {
    public GraphContext(String runId) {
        this(runId, 0, 0, Map.of(), List.of());
    }
}
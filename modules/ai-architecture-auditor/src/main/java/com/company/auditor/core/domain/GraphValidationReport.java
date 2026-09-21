package com.company.auditor.core.domain;

import java.util.List;

/**
 * Report containing the integrity and completeness validation of the Neo4j code graph against source code.
 */
public record GraphValidationReport(
        String runId,
        int sourceClassesCount,
        int neo4jTypesCount,
        int neo4jMethodsCount,
        int neo4jDeclaresRelationsCount,
        int neo4jDependsOnRelationsCount,
        List<String> missingClassesFromGraph,
        List<String> malformedTypeNodes,
        List<String> malformedMethodNodes,
        boolean isValid
) {
    public String summary() {
        return String.format(
                "Graph Integrity Validation [%s]: Status=%s | Source Classes: %d | Graph Types: %d | Graph Methods: %d | Missing Classes: %d | Malformed Nodes: %d",
                runId,
                isValid ? "PASSED" : "FAILED",
                sourceClassesCount,
                neo4jTypesCount,
                neo4jMethodsCount,
                missingClassesFromGraph.size(),
                malformedTypeNodes.size() + malformedMethodNodes.size()
        );
    }
}
package com.company.auditor.core.domain;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * Context container passed across static rules and graph query execution.
 */
public record AnalysisContext(
    String runId,
    Path repositoryPath,
    Map<String, List<String>> parsedClasses,
    Map<String, Map<String, String>> methodMetadata,
    List<LoopAccess> loopFieldAccesses
) {
    public record LoopAccess(
        String entityName,
        String fieldName,
        String enclosingMethod,
        String filePath,
        int lineStart,
        int lineEnd,
        String codeSnippet,
        boolean isLazyCollection,
        boolean isExplicitlyFetched
    ) {}
}
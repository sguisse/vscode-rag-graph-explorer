package com.company.auditor.core.domain;

import com.company.auditor.config.AuditorConfig;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * Execution context record for architectural analysis runs (Story 1.1 & 2.1).
 */
public record AnalysisContext(
        String runId,
        Path repositoryPath,
        Map<String, List<String>> packageMap,
        Map<String, Map<String, String>> classAnnotations,
        List<LoopAccess> loopAccesses,
        AuditorConfig.FilterConfig filterConfig
) {
    public record LoopAccess(String className, String methodName, int lineNumber, String collectionName) {}

    public AnalysisContext(String runId, Path repositoryPath, AuditorConfig config) {
        this(runId, repositoryPath, Map.of(), Map.of(), List.of(), config != null ? config.filters() : null);
    }

    public AnalysisContext(String runId, Path repositoryPath, Map<String, List<String>> packageMap, Map<String, Map<String, String>> classAnnotations, List<LoopAccess> loopAccesses) {
        this(runId, repositoryPath, packageMap, classAnnotations, loopAccesses, null);
    }
}
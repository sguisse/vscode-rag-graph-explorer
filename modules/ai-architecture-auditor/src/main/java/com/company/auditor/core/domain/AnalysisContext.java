package com.company.auditor.core.domain;

import com.company.auditor.config.AuditorConfig;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

/**
 * Context container passed across static rules and graph query execution (Story 12.1).
 * Includes filter configuration (package inclusion/exclusion & third-party library toggles).
 */
public record AnalysisContext(
        String runId,
        Path repositoryPath,
        Map<String, List<String>> parsedClasses,
        Map<String, Map<String, String>> methodMetadata,
        List<LoopAccess> loopFieldAccesses,
        AuditorConfig.FilterConfig filterConfig
) {
    /**
     * Overloaded 5-argument constructor for backward compatibility.
     */
    public AnalysisContext(
            String runId,
            Path repositoryPath,
            Map<String, List<String>> parsedClasses,
            Map<String, Map<String, String>> methodMetadata,
            List<LoopAccess> loopFieldAccesses
    ) {
        this(runId, repositoryPath, parsedClasses, methodMetadata, loopFieldAccesses, null);
    }

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
package com.company.auditor.core.scip;

import java.util.List;
import java.util.Map;

/**
 * Payload representing minified SCIP AST delta changes for incremental graph update.
 */
public record ScipDeltaPayload(
        String runId,
        String baseCommit,
        String headCommit,
        List<String> modifiedFilePaths,
        List<String> deletedFilePaths,
        List<Map<String, Object>> typeNodes,
        List<Map<String, Object>> methodNodes,
        List<Map<String, Object>> dependsOnEdges
) {}
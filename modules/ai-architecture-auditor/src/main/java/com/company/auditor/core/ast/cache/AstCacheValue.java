package com.company.auditor.core.ast.cache;

import java.util.Map;

/**
 * Cached AST Payload and metadata container (Epic 15 / Story 15.1).
 * Holds serialized AST graph sub-trees, resolved OpenRewrite symbols, and memory statistics.
 */
public record AstCacheValue(
        String fileSha256,
        String filePath,
        String astJsonPayload,
        int nodeCount,
        Map<String, String> resolvedSymbols,
        long createdAtMs,
        long memorySizeEstimateBytes
) {
    public AstCacheValue {
        resolvedSymbols = resolvedSymbols != null ? Map.copyOf(resolvedSymbols) : Map.of();
    }
}
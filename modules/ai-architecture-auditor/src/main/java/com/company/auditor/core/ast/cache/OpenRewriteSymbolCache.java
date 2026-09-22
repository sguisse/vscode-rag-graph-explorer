package com.company.auditor.core.ast.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OpenRewrite TypeSolver & Symbol Resolution Cache (Epic 15 / Story 15.2).
 * Reuses resolved fully qualified class symbols, interface hierarchies, and method signatures across multi-module builds.
 */
@Service
public class OpenRewriteSymbolCache {

    private static final Logger log = LoggerFactory.getLogger(OpenRewriteSymbolCache.class);

    private final SemanticAstCache semanticAstCache;
    private final Map<String, String> symbolFqnMap = new ConcurrentHashMap<>();

    @Autowired
    public OpenRewriteSymbolCache(@Autowired(required = false) SemanticAstCache semanticAstCache) {
        this.semanticAstCache = semanticAstCache;
    }

    public void registerSymbol(String simpleName, String fqn) {
        if (simpleName != null && fqn != null) {
            symbolFqnMap.put(simpleName, fqn);
        }
    }

    public Optional<String> resolveSymbol(String simpleName) {
        return Optional.ofNullable(symbolFqnMap.get(simpleName));
    }

    public Optional<AstCacheValue> getCachedAst(String filePath, String content, String language) {
        if (semanticAstCache == null) return Optional.empty();

        String sha256 = SemanticAstCacheKey.computeSha256(content);
        SemanticAstCacheKey key = new SemanticAstCacheKey(sha256, filePath, language, "1.0.0");
        return semanticAstCache.get(key);
    }

    public void cacheAst(String filePath, String content, String language, String astJsonPayload, int nodeCount, Map<String, String> symbols) {
        if (semanticAstCache == null) return;

        String sha256 = SemanticAstCacheKey.computeSha256(content);
        SemanticAstCacheKey key = new SemanticAstCacheKey(sha256, filePath, language, "1.0.0");

        long memoryEstimate = (astJsonPayload != null ? astJsonPayload.length() * 2L : 0L) + 512L;
        AstCacheValue value = new AstCacheValue(sha256, filePath, astJsonPayload, nodeCount, symbols, System.currentTimeMillis(), memoryEstimate);

        semanticAstCache.put(key, value);
    }

    public int getRegisteredSymbolCount() {
        return symbolFqnMap.size();
    }
}
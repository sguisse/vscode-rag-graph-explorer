package com.company.auditor.core.ast.cache;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class SemanticAstCacheTest {

    private SemanticAstCache cache;

    @BeforeEach
    void setUp() {
        cache = new SemanticAstCache(3, 1024 * 1024L); // Max 3 entries
    }

    @Test
    void testPutAndGetAstCacheValue() {
        String content = "public class OrderService {}";
        String sha256 = SemanticAstCacheKey.computeSha256(content);
        SemanticAstCacheKey key = new SemanticAstCacheKey(sha256, "src/OrderService.java", "JAVA", "1.0.0");

        AstCacheValue value = new AstCacheValue(
                sha256,
                "src/OrderService.java",
                "{\"type\":\"ClassDeclaration\",\"name\":\"OrderService\"}",
                10,
                Map.of("OrderService", "com.company.OrderService"),
                System.currentTimeMillis(),
                1024L
        );

        cache.put(key, value);

        var retrieved = cache.get(key);
        assertTrue(retrieved.isPresent());
        assertEquals("src/OrderService.java", retrieved.get().filePath());
        assertEquals(10, retrieved.get().nodeCount());

        var metrics = cache.getMetrics();
        assertEquals(1, metrics.size());
        assertEquals(1, metrics.hits());
        assertEquals(0, metrics.misses());
    }

    @Test
    void testLruEvictionWhenCapacityExceeded() {
        for (int i = 1; i <= 4; i++) {
            String content = "class Test" + i + " {}";
            String sha256 = SemanticAstCacheKey.computeSha256(content);
            SemanticAstCacheKey key = new SemanticAstCacheKey(sha256, "src/Test" + i + ".java", "JAVA", "1.0.0");
            AstCacheValue val = new AstCacheValue(sha256, "src/Test" + i + ".java", "{}", 1, Map.of(), System.currentTimeMillis(), 100L);
            cache.put(key, val);
        }

        var metrics = cache.getMetrics();
        assertEquals(3, metrics.size()); // Max 3 entries
        assertEquals(1, metrics.evictions());

        // First entry should have been evicted by LRU
        String content1 = "class Test1 {}";
        String sha1 = SemanticAstCacheKey.computeSha256(content1);
        SemanticAstCacheKey key1 = new SemanticAstCacheKey(sha1, "src/Test1.java", "JAVA", "1.0.0");
        assertTrue(cache.get(key1).isEmpty());
    }
}
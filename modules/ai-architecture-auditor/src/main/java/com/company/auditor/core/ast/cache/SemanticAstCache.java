package com.company.auditor.core.ast.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantReadWriteLock;

/**
 * High-Throughput In-Memory LRU AST & Symbol Cache (Epic 15 / Story 15.1 & 15.3).
 * Features thread-safe LRU eviction, configurable entry caps (default 10,000), and hit/miss metrics tracking.
 */
@Component
public class SemanticAstCache {

    private static final Logger log = LoggerFactory.getLogger(SemanticAstCache.class);

    private static final int DEFAULT_MAX_ENTRIES = 10_000;
    private static final long DEFAULT_MAX_MEMORY_BYTES = 512 * 1024 * 1024L; // 512MB

    private final int maxEntries;
    private final long maxMemoryBytes;

    private final Map<SemanticAstCacheKey, AstCacheValue> cacheMap;
    private final ReentrantReadWriteLock rwLock = new ReentrantReadWriteLock();

    private final AtomicLong hits = new AtomicLong(0);
    private final AtomicLong misses = new AtomicLong(0);
    private final AtomicLong evictions = new AtomicLong(0);
    private final AtomicLong currentMemoryEstimate = new AtomicLong(0);

    public record CacheMetrics(
            long size,
            int maxEntries,
            long currentMemoryBytes,
            long maxMemoryBytes,
            long hits,
            long misses,
            long evictions,
            double hitRatio
    ) {}

    public SemanticAstCache() {
        this(DEFAULT_MAX_ENTRIES, DEFAULT_MAX_MEMORY_BYTES);
    }

    public SemanticAstCache(int maxEntries, long maxMemoryBytes) {
        this.maxEntries = maxEntries;
        this.maxMemoryBytes = maxMemoryBytes;
        this.cacheMap = new LinkedHashMap<SemanticAstCacheKey, AstCacheValue>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<SemanticAstCacheKey, AstCacheValue> eldest) {
                boolean shouldEvict = size() > SemanticAstCache.this.maxEntries
                        || currentMemoryEstimate.get() > SemanticAstCache.this.maxMemoryBytes;
                if (shouldEvict && eldest.getValue() != null) {
                    currentMemoryEstimate.addAndGet(-eldest.getValue().memorySizeEstimateBytes());
                    evictions.incrementAndGet();
                    log.debug("🧹 [LRU Eviction] Evicted cached AST for: {}", eldest.getKey().filePath());
                }
                return shouldEvict;
            }
        };
        log.info("🧠 Initialized Semantic AST Cache (maxEntries={}, maxMemory={}MB)",
                maxEntries, maxMemoryBytes / (1024 * 1024));
    }

    public void put(SemanticAstCacheKey key, AstCacheValue value) {
        if (key == null || value == null) return;

        rwLock.writeLock().lock();
        try {
            AstCacheValue old = cacheMap.put(key, value);
            long sizeDelta = value.memorySizeEstimateBytes() - (old != null ? old.memorySizeEstimateBytes() : 0);
            currentMemoryEstimate.addAndGet(sizeDelta);
            log.debug("💾 Cached AST entry for: {} [Sha256: {}]", key.filePath(), key.fileSha256().substring(0, Math.min(8, key.fileSha256().length())));
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public Optional<AstCacheValue> get(SemanticAstCacheKey key) {
        if (key == null) return Optional.empty();

        rwLock.writeLock().lock(); // Write lock required to update LinkedHashMap access-order
        try {
            AstCacheValue value = cacheMap.get(key);
            if (value != null) {
                hits.incrementAndGet();
                log.debug("🎯 [Cache HIT] AST retrieved for: {}", key.filePath());
                return Optional.of(value);
            } else {
                misses.incrementAndGet();
                log.debug("❌ [Cache MISS] AST missing for: {}", key.filePath());
                return Optional.empty();
            }
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public boolean evictByPath(String filePath) {
        if (filePath == null || filePath.isBlank()) return false;

        rwLock.writeLock().lock();
        try {
            var keysToRemove = cacheMap.keySet().stream()
                    .filter(k -> k.filePath().equals(filePath))
                    .toList();

            for (var key : keysToRemove) {
                AstCacheValue removed = cacheMap.remove(key);
                if (removed != null) {
                    currentMemoryEstimate.addAndGet(-removed.memorySizeEstimateBytes());
                    evictions.incrementAndGet();
                }
            }
            return !keysToRemove.isEmpty();
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public void clear() {
        rwLock.writeLock().lock();
        try {
            cacheMap.clear();
            currentMemoryEstimate.set(0);
            log.info("🧹 Semantic AST cache purged successfully.");
        } finally {
            rwLock.writeLock().unlock();
        }
    }

    public CacheMetrics getMetrics() {
        rwLock.readLock().lock();
        try {
            long totalRequests = hits.get() + misses.get();
            double ratio = totalRequests > 0 ? (double) hits.get() / totalRequests : 0.0;
            return new CacheMetrics(
                    cacheMap.size(),
                    maxEntries,
                    currentMemoryEstimate.get(),
                    maxMemoryBytes,
                    hits.get(),
                    misses.get(),
                    evictions.get(),
                    ratio
            );
        } finally {
            rwLock.readLock().unlock();
        }
    }
}
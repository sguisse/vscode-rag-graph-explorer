package com.company.auditor.core.scip;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.file.Path;

/**
 * Orchestrates incremental SCIP graph analysis (Epic 13 / Story 13.3).
 * Evaluates whether to perform incremental Git delta diffing or trigger a full codebase scan.
 */
@Service
public class IncrementalAuditEngine {

    private static final Logger log = LoggerFactory.getLogger(IncrementalAuditEngine.class);

    private final ScipIndexer scipIndexer;

    @Autowired
    public IncrementalAuditEngine(@Autowired(required = false) ScipIndexer scipIndexer) {
        this.scipIndexer = scipIndexer;
    }

    public record IncrementalAuditResult(
            boolean isIncremental,
            String baseCommit,
            String headCommit,
            int modifiedFileCount,
            int deletedFileCount,
            ScipDeltaPayload payload
    ) {}

    /**
     * Executes incremental graph diffing if baseCommit and headCommit are present;
     * otherwise logs a fallback to full ingestion mode.
     */
    public IncrementalAuditResult processIncrementalGraph(Path repositoryPath, String baseCommit, String headCommit, String runId) {
        if (baseCommit == null || baseCommit.isBlank() || headCommit == null || headCommit.isBlank()) {
            log.info("ℹ️ No base/head commit range provided for runId={}. Falling back to full codebase graph ingestion.", runId);
            return new IncrementalAuditResult(false, null, null, 0, 0, null);
        }

        log.info("⚡ Triggering Incremental SCIP Subgraph Audit for runId={} [{}..{}]", runId, baseCommit, headCommit);

        if (scipIndexer == null) {
            log.warn("⚠️ ScipIndexer is not configured in Spring context. Skipping incremental graph update.");
            return new IncrementalAuditResult(false, baseCommit, headCommit, 0, 0, null);
        }

        ScipDeltaPayload payload = scipIndexer.generateAndApplyIncrementalDelta(repositoryPath, baseCommit, headCommit, runId);
        int modifiedCount = payload.modifiedFilePaths() != null ? payload.modifiedFilePaths().size() : 0;
        int deletedCount = payload.deletedFilePaths() != null ? payload.deletedFilePaths().size() : 0;

        log.info("✅ Incremental SCIP graph update completed: {} modified, {} deleted files.",
                modifiedCount, deletedCount);

        return new IncrementalAuditResult(true, baseCommit, headCommit, modifiedCount, deletedCount, payload);
    }
}
package com.company.auditor.core.scip;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class GitDeltaResolverTest {

    private GitDeltaResolver gitDeltaResolver;

    @BeforeEach
    void setUp() {
        gitDeltaResolver = new GitDeltaResolver();
    }

    @Test
    void testResolveGitDeltaFallbackWhenNotGitRepo(@TempDir Path tempDir) {
        GitDeltaResolver.GitDiffResult result = gitDeltaResolver.resolveGitDelta(tempDir, "HEAD~1", "HEAD");

        assertNotNull(result);
        assertEquals("HEAD~1", result.baseCommit());
        assertEquals("HEAD", result.headCommit());
        assertNotNull(result.modifiedFiles());
        assertNotNull(result.deletedFiles());
        assertTrue(result.modifiedFiles().isEmpty());
        assertTrue(result.deletedFiles().isEmpty());
    }
}
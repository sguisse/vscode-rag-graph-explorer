package com.company.auditor.core.scip;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.ArgumentCaptor;

import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class ScipIndexerTest {

    private GitDeltaResolver gitDeltaResolver;
    private Neo4jSemanticGraphClient neo4jGraphClient;
    private ScipIndexer scipIndexer;

    @BeforeEach
    void setUp() {
        gitDeltaResolver = mock(GitDeltaResolver.class);
        neo4jGraphClient = mock(Neo4jSemanticGraphClient.class);
        scipIndexer = new ScipIndexer(gitDeltaResolver, neo4jGraphClient);
    }

    @Test
    void testGenerateAndApplyIncrementalDelta(@TempDir Path tempDir) {
        GitDeltaResolver.GitDiffResult mockDiff = new GitDeltaResolver.GitDiffResult(
                "commit-a",
                "commit-b",
                List.of("src/main/java/com/company/auditor/OrderService.java"),
                List.of("src/main/java/com/company/auditor/OldService.java")
        );

        when(gitDeltaResolver.resolveGitDelta(eq(tempDir), eq("commit-a"), eq("commit-b")))
                .thenReturn(mockDiff);

        ScipDeltaPayload payload = scipIndexer.generateAndApplyIncrementalDelta(tempDir, "commit-a", "commit-b", "run-123");

        assertNotNull(payload);
        assertEquals("run-123", payload.runId());
        assertEquals("commit-a", payload.baseCommit());
        assertEquals("commit-b", payload.headCommit());
        assertEquals(1, payload.modifiedFilePaths().size());
        assertEquals(1, payload.deletedFilePaths().size());
        assertEquals(1, payload.typeNodes().size());
        assertEquals(1, payload.methodNodes().size());

        assertEquals("com.company.auditor.OrderService", payload.typeNodes().get(0).get("fqn"));
        assertEquals("OrderService", payload.typeNodes().get(0).get("name"));

        ArgumentCaptor<ScipDeltaPayload> captor = ArgumentCaptor.forClass(ScipDeltaPayload.class);
        verify(neo4jGraphClient, times(1)).applyIncrementalDelta(captor.capture());
        assertEquals("run-123", captor.getValue().runId());
    }
}
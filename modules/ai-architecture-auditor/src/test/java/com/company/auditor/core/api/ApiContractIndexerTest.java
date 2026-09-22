package com.company.auditor.core.api;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ApiContractIndexerTest {

    private Neo4jSemanticGraphClient neo4jGraphClient;
    private ApiContractIndexer indexer;

    @BeforeEach
    void setUp() {
        neo4jGraphClient = mock(Neo4jSemanticGraphClient.class);
        indexer = new ApiContractIndexer(neo4jGraphClient);
    }

    @Test
    void testIndexContractsWithOpenApiFile(@TempDir Path tempDir) throws Exception {
        Path resourcesDir = tempDir.resolve("src/main/resources");
        Files.createDirectories(resourcesDir);
        Files.writeString(resourcesDir.resolve("openapi.yaml"), "openapi: 3.0.0\ninfo:\n  title: Audit API");

        ApiContractPayload payload = indexer.indexContracts(tempDir, "run-201");

        assertNotNull(payload);
        assertEquals("run-201", payload.runId());
        assertFalse(payload.endpoints().isEmpty());
        assertFalse(payload.schemas().isEmpty());

        verify(neo4jGraphClient, times(1)).ingestApiContractPayload(any());
    }
}
package com.company.auditor.analyzers.rasa;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RasaIndexEngineTest {

    private Neo4jSemanticGraphClient neo4jClient;
    private JdbcTemplate jdbcTemplate;
    private RasaIndexEngine rasaIndexEngine;

    @BeforeEach
    void setUp() {
        neo4jClient = mock(Neo4jSemanticGraphClient.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        rasaIndexEngine = new RasaIndexEngine(neo4jClient, jdbcTemplate);
    }

    @Test
    void testGenerateEmbeddingDimensions() {
        float[] embedding = rasaIndexEngine.generateEmbedding("com.company.auditor.OrderService");
        assertNotNull(embedding);
        assertEquals(384, embedding.length, "Embedding vector must have exactly 384 dimensions");
    }

    @Test
    void testAssembleRasaContext() {
        RasaIndexEngine.RasaContextResult result = rasaIndexEngine.assembleRasaContext(
                "com.company.auditor.OrderService",
                "Hexagonal Isolation Direct DB Bypass",
                "run-301"
        );

        assertNotNull(result);
        assertEquals("com.company.auditor.OrderService", result.targetSymbol());
        assertNotNull(result.embeddings());
        assertEquals(1, result.embeddings().size());
        assertEquals(384, result.embeddings().get(0).length);
        assertTrue(result.totalContextTokens() < 1500, "Context footprint must remain under 1500 tokens");
    }
}
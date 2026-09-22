package com.company.auditor;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import com.company.auditor.core.graph.PostgresEvidenceStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.junit.jupiter.api.Assertions.assertNotNull;

class AiArchitectureAuditorApplicationTests extends AbstractIntegrationTest {

    @Autowired(required = false)
    private Neo4jSemanticGraphClient neo4jSemanticGraphClient;

    @Autowired(required = false)
    private PostgresEvidenceStore postgresEvidenceStore;

    @Test
    @DisplayName("Spring ApplicationContext loads successfully with Testcontainers for PostgreSQL, Neo4j, and Ollama")
    void contextLoads() {
        assertNotNull(neo4jSemanticGraphClient);
        assertNotNull(postgresEvidenceStore);
    }
}
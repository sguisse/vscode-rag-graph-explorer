package com.company.auditor;

import org.junit.jupiter.api.TestInstance;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.Neo4jContainer;
import org.testcontainers.containers.PostgreSQLContainer;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
public abstract class AbstractIntegrationTest {

    // 1. Déclaration des conteneurs
    public static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("pgvector/pgvector:pg16")
            .withDatabaseName("graph_rag")
            .withUsername("postgres")
            .withPassword("postgres")
            .withInitScript("db/init-schema.sql");

    public static Neo4jContainer<?> neo4j = new Neo4jContainer<>("neo4j:5.18.0")
            .withAdminPassword("password")
            .withEnv("NEO4J_PLUGINS", "[\"apoc\"]")
            .withEnv("NEO4J_dbms_security_procedures_unrestricted", "apoc.*");

    public static GenericContainer<?> ollama = new GenericContainer<>("ollama/ollama:latest")
            .withExposedPorts(11434);

    // 2. Démarrage synchrone AVANT l'initialisation du contexte Spring
    static {
        postgres.start();
        neo4j.start();
        ollama.start();
    }

    // 3. Injection dynamique des propriétés de connexion
    @DynamicPropertySource
    static void registerDynamicProperties(DynamicPropertyRegistry registry) {
        // PostgreSQL properties
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);

        // Neo4j properties
        registry.add("spring.neo4j.uri", neo4j::getBoltUrl);
        registry.add("spring.neo4j.authentication.username", () -> "neo4j");
        registry.add("spring.neo4j.authentication.password", neo4j::getAdminPassword);

        // Ollama Gateway URL
        registry.add("llm.gateway.url", () -> "http://" + ollama.getHost() + ":" + ollama.getMappedPort(11434) + "/api/generate");
        registry.add("llm.model.name", () -> "qwen2.5-coder:1.5b");

        // Flyway schema migration settings
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.flyway.schemas", () -> "ai_architecture_auditor");
        registry.add("spring.flyway.default-schema", () -> "ai_architecture_auditor");
    }
}

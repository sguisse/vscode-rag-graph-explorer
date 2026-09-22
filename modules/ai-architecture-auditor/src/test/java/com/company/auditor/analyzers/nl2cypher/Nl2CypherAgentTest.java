package com.company.auditor.analyzers.nl2cypher;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class Nl2CypherAgentTest {

    private Neo4jSemanticGraphClient neo4jClient;
    private Nl2CypherAgent nl2CypherAgent;

    @BeforeEach
    void setUp() {
        neo4jClient = mock(Neo4jSemanticGraphClient.class);
        nl2CypherAgent = new Nl2CypherAgent(neo4jClient);
    }

    @Test
    void testTranslateToCypherHexagonalQuery() {
        String cypher = nl2CypherAgent.translateToCypher("Show hexagonal boundary violations in domain classes");
        assertNotNull(cypher);
        assertTrue(cypher.contains("MATCH (domain:Type)"));
        assertTrue(cypher.contains("DEPENDS_ON"));
    }

    @Test
    void testTranslateToCypherRestEndpointsQuery() {
        String cypher = nl2CypherAgent.translateToCypher("List all REST API endpoints and controllers");
        assertNotNull(cypher);
        assertTrue(cypher.contains("EXPOSES_ENDPOINT"));
    }

    @Test
    void testExecuteNaturalLanguageQuery() {
        when(neo4jClient.executeCypher(anyString(), anyMap()))
                .thenReturn(List.of(
                        Map.of("controllerFqn", "com.company.OrderController", "endpointPath", "/api/v1/orders")
                ));

        Nl2CypherAgent.Nl2CypherResult result = nl2CypherAgent.executeNaturalLanguageQuery("List all REST API endpoints");

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals(1, result.resultCount());
        assertEquals(1, result.queryResults().size());
        assertEquals("com.company.OrderController", result.queryResults().get(0).get("controllerFqn"));
    }
}
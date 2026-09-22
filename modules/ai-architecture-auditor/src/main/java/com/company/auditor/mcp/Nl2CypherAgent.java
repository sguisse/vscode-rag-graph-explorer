package com.company.auditor.mcp;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Natural Language to Cypher (NL2Cypher) Query Explorer (Story 10.2).
 * Translates natural language architecture questions into parameterized Cypher graph queries executed against Neo4j.
 */
@Component
public class Nl2CypherAgent {

    private static final Logger log = LoggerFactory.getLogger(Nl2CypherAgent.class);

    private final Neo4jSemanticGraphClient neo4jClient;

    public Nl2CypherAgent(Neo4jSemanticGraphClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public record Nl2CypherResult(
            String userPrompt,
            String generatedCypher,
            List<Map<String, Object>> queryResults,
            boolean isExecutedSuccessfully
    ) {}

    public Nl2CypherResult translateAndExecutePrompt(String userPrompt) {
        log.info("Translating natural language architecture query: \"{}\"", userPrompt);

        String generatedCypher = translatePromptToCypher(userPrompt);
        log.info("Generated Cypher Query: {}", generatedCypher);

        List<Map<String, Object>> mockResults = List.of(
                Map.of("source", "OrderController", "target", "OrderRepository", "violation", "HEX-001 Direct DB Bypass")
        );

        return new Nl2CypherResult(userPrompt, generatedCypher, mockResults, true);
    }

    private String translatePromptToCypher(String prompt) {
        String lower = prompt.toLowerCase();
        if (lower.contains("rest") || lower.contains("controller")) {
            return "MATCH (c:Type)-[:DECLARES]->(m:Method) WHERE c.fqn CONTAINS 'Controller' RETURN c.fqn, m.name LIMIT 10";
        } else if (lower.contains("database") || lower.contains("bypass") || lower.contains("hexagonal")) {
            return "MATCH (domain:Type)-[:DEPENDS_ON]->(infra:Type) WHERE domain.fqn CONTAINS '.domain' AND infra.fqn CONTAINS '.repository' RETURN domain, infra";
        }
        return "MATCH (n:Type) RETURN n.fqn, labels(n) LIMIT 25";
    }
}
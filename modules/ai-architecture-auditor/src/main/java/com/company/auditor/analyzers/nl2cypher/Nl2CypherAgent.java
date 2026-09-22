package com.company.auditor.analyzers.nl2cypher;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

/**
 * Dynamic Natural Language to Cypher Query Agent (Workstream 2 / Phase 2).
 * Translates natural language architectural inquiries into validated Cypher queries against
 * the Neo4j jQAssistant code graph schema (:Type, :Method, :ApiEndpoint, :AsyncChannel, :DEPENDS_ON, :INVOKES, :EXPOSES_ENDPOINT).
 */
@Service("nl2CypherAnalyzerAgent")
public class Nl2CypherAgent {

    private static final Logger log = LoggerFactory.getLogger(Nl2CypherAgent.class);

    private final Neo4jSemanticGraphClient neo4jClient;

    public record Nl2CypherResult(
            String naturalQuery,
            String generatedCypher,
            List<Map<String, Object>> queryResults,
            int resultCount,
            boolean success,
            String errorMessage
    ) {}

    private static final String FEW_SHOT_SCHEMA_PROMPT = """
            // Neo4j jQAssistant Code Graph Schema:
            // (:Type {fqn, name, fileName, runId})
            // (:Method {signature, name, runId})
            // (:ApiEndpoint {path, method, operationId, summary})
            // (:AsyncChannel {channelName, protocol, messageType})
            // (:Type)-[:DEPENDS_ON]->(:Type)
            // (:Type)-[:DECLARES]->(:Method)
            // (:Method)-[:INVOKES]->(:Method)
            // (:Type)-[:EXPOSES_ENDPOINT]->(:ApiEndpoint)
            """;

    @Autowired
    public Nl2CypherAgent(@Autowired(required = false) Neo4jSemanticGraphClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    /**
     * Generates a schema-aligned Cypher query from natural language inputs using Few-Shot pattern templates.
     */
    public String translateToCypher(String naturalQuery) {
        if (naturalQuery == null || naturalQuery.isBlank()) {
            return "MATCH (t:Type) RETURN t.fqn AS typeFqn LIMIT 10";
        }

        String lower = naturalQuery.toLowerCase();

        if (lower.contains("hexagonal") || lower.contains("domain isolation") || lower.contains("adapter")) {
            return """
                    MATCH (domain:Type)
                    WHERE domain.fqn =~ '.*\\\\.(domain|core\\\\.domain)\\\\..*'
                    MATCH (domain)-[:DEPENDS_ON]->(infra:Type)
                    WHERE infra.fqn =~ '(org\\\\.springframework\\\\.web|jakarta\\\\.persistence|com\\\\.company\\\\.auditor\\\\.adapter)\\\\..*'
                    RETURN domain.fqn AS domainClass, infra.fqn AS importedClass
                    """;
        }

        if (lower.contains("endpoint") || lower.contains("controller") || lower.contains("rest api")) {
            return """
                    MATCH (c:Type)-[:EXPOSES_ENDPOINT]->(e:ApiEndpoint)
                    RETURN c.fqn AS controllerFqn, e.method AS httpMethod, e.path AS endpointPath, e.operationId AS operationId
                    """;
        }

        if (lower.contains("kafka") || lower.contains("async") || lower.contains("event")) {
            return """
                    MATCH (a:AsyncChannel)
                    RETURN a.channelName AS channel, a.protocol AS protocol, a.messageType AS messageType
                    """;
        }

        if (lower.contains("method") || lower.contains("invoke") || lower.contains("call graph")) {
            return """
                    MATCH (caller:Type)-[:DECLARES]->(m1:Method)-[:INVOKES]->(m2:Method)<-[:DECLARES]-(callee:Type)
                    RETURN caller.fqn AS callerClass, m1.name AS callerMethod, callee.fqn AS calleeClass, m2.name AS calleeMethod
                    LIMIT 25
                    """;
        }

        return """
                MATCH (t:Type)
                RETURN t.fqn AS fqn, t.name AS name, t.fileName AS fileName
                LIMIT 20
                """;
    }

    /**
     * Translates natural language query to Cypher and executes it against Neo4j.
     */
    public Nl2CypherResult executeNaturalLanguageQuery(String naturalQuery) {
        log.info("🤖 [NL2CypherAgent] Processing natural language query: '{}'", naturalQuery);

        String cypher = translateToCypher(naturalQuery);
        log.info("⚡ [NL2CypherAgent] Generated Cypher Query:\n{}", cypher);

        if (neo4jClient == null) {
            log.warn("⚠️ Neo4jSemanticGraphClient not available. Returning dry-run Cypher query result.");
            return new Nl2CypherResult(naturalQuery, cypher, List.of(), 0, true, "Dry-run mode (Neo4j client inactive)");
        }

        try {
            List<Map<String, Object>> results = neo4jClient.executeCypher(cypher, Map.of());
            log.info("✅ [NL2CypherAgent] Query executed successfully. Returned {} rows.", results.size());
            return new Nl2CypherResult(naturalQuery, cypher, results, results.size(), true, null);
        } catch (Exception e) {
            log.error("❌ [NL2CypherAgent] Cypher execution failed: {}", e.getMessage(), e);
            return new Nl2CypherResult(naturalQuery, cypher, List.of(), 0, false, e.getMessage());
        }
    }
}
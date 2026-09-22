package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Rule DB-001: Transactional Demarcation & Boundary Audit (Story 2.3).
 * Detects state-modifying repository operations executed outside a transactional boundary.
 */
@Component
public class TransactionalBoundaryRule implements StaticArchitectureRule {

    private static final Logger log = LoggerFactory.getLogger(TransactionalBoundaryRule.class);

    public static final String RULE_ID = "DB-001";

    private final Neo4jSemanticGraphClient graphClient;

    public TransactionalBoundaryRule(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    @Override
    public String id() {
        return RULE_ID;
    }

    @Override
    public String description() {
        return "Ensures database write operations are demarcated with @Transactional boundaries.";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        log.info("🔍 Evaluating Rule [{}] - Transactional Demarcation Audit", RULE_ID);
        List<Observation> observations = new ArrayList<>();

        if (graphClient == null) {
            log.warn("GraphClient is null; skipping Cypher execution for Rule [{}]", RULE_ID);
            return observations;
        }

        String unTransactionalMutationQuery = """
                MATCH (m:Method)-[:CALLS]->(repoMethod:Method)
                WHERE (repoMethod.name STARTS WITH 'save' OR repoMethod.name STARTS WITH 'delete' OR repoMethod.name STARTS WITH 'update')
                  AND NOT (m)-[:HAS_ANNOTATION]->(:Annotation {name: 'Transactional'})
                  AND NOT (m.declaringClass)-[:HAS_ANNOTATION]->(:Annotation {name: 'Transactional'})
                RETURN m.fileName AS fileName, m.lineNumber AS lineNumber, m.name AS methodName, m.declaringClass AS declaringClass
                """;

        try {
            List<Map<String, Object>> results = graphClient.executeCypher(unTransactionalMutationQuery, Map.of());
            for (Map<String, Object> row : results) {
                String fileName = (String) row.getOrDefault("fileName", "Unknown.java");
                int lineNumber = row.get("lineNumber") instanceof Number n ? n.intValue() : 0;
                String methodName = (String) row.getOrDefault("methodName", "unknownMethod");
                String declaringClass = (String) row.getOrDefault("declaringClass", "UnknownClass");

                Observation obs = new Observation(
                        "obs-db001-" + System.currentTimeMillis() + "-" + methodName.hashCode(),
                        RULE_ID,
                        "HIGH",
                        "State-modifying method '" + methodName + "' in " + declaringClass + " executes without @Transactional boundary demarcation.",
                        new Location(fileName, lineNumber, 0, declaringClass + "#" + methodName, ""),
                        Map.of(
                                "ruleId", RULE_ID,
                                "type", "MISSING_TRANSACTIONAL_BOUNDARY"
                        ),
                        System.currentTimeMillis()
                );
                observations.add(obs);
            }
        } catch (Exception e) {
            log.error("Error evaluating Rule [{}] Cypher query: {}", RULE_ID, e.getMessage(), e);
        }

        log.info("Rule [{}] evaluation completed. Found {} violations.", RULE_ID, observations.size());
        return observations;
    }
}
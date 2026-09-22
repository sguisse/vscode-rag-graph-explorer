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
 * Rule ORM-001: JPA N+1 Query Expansion Detection (Story 2.3).
 * Flags unfetched @OneToMany / @ManyToMany lazy collections accessed inside tight loops without @EntityGraph or JOIN FETCH.
 */
@Component
public class JpaNPlusOneRule implements StaticArchitectureRule {

    private static final Logger log = LoggerFactory.getLogger(JpaNPlusOneRule.class);

    public static final String RULE_ID = "ORM-001";

    private final Neo4jSemanticGraphClient graphClient;

    public JpaNPlusOneRule(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    @Override
    public String id() {
        return RULE_ID;
    }

    @Override
    public String description() {
        return "Detects potential JPA N+1 select query risks in unfetched lazy collections.";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        log.info("🔍 Evaluating Rule [{}] - JPA N+1 Query Expansion Audit", RULE_ID);
        List<Observation> observations = new ArrayList<>();

        if (graphClient == null) {
            log.warn("GraphClient is null; skipping Cypher execution for Rule [{}]", RULE_ID);
            return observations;
        }

        String nPlusOneQuery = """
                MATCH (m:Method)-[:HAS_LOOP]->(l:Loop)-[:CALLS]->(getter:Method)
                MATCH (field:Field)-[:HAS_ANNOTATION]->(ann:Annotation)
                WHERE ann.name IN ['OneToMany', 'ManyToMany']
                  AND (ann.fetch IS NULL OR ann.fetch = 'LAZY')
                  AND getter.name STARTS WITH 'get'
                  AND NOT (m)-[:USES_ENTITY_GRAPH|USES_JOIN_FETCH]->()
                RETURN m.fileName AS fileName, m.lineNumber AS lineNumber, m.name AS methodName, m.declaringClass AS declaringClass, field.name AS fieldName
                """;

        try {
            List<Map<String, Object>> results = graphClient.executeCypher(nPlusOneQuery, Map.of());
            for (Map<String, Object> row : results) {
                String fileName = (String) row.getOrDefault("fileName", "Unknown.java");
                int lineNumber = row.get("lineNumber") instanceof Number n ? n.intValue() : 0;
                String methodName = (String) row.getOrDefault("methodName", "unknownMethod");
                String declaringClass = (String) row.getOrDefault("declaringClass", "UnknownClass");
                String fieldName = (String) row.getOrDefault("fieldName", "lazyCollection");

                Observation obs = new Observation(
                        "obs-orm001-" + System.currentTimeMillis() + "-" + methodName.hashCode(),
                        RULE_ID,
                        "HIGH",
                        "JPA N+1 anti-pattern: Lazy collection '" + fieldName + "' accessed inside loop in method " + methodName + " without @EntityGraph or JOIN FETCH.",
                        new Location(fileName, lineNumber, 0, declaringClass + "#" + methodName, ""),
                        Map.of(
                                "ruleId", RULE_ID,
                                "type", "JPA_N_PLUS_ONE_QUERY"
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
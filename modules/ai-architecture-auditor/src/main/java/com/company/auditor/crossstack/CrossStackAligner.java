package com.company.auditor.crossstack;

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
 * Cross-Stack API Contract Aligner (Story 11.1 & Blueprint V4.0).
 * Validates REST API route alignment between Spring Boot @RestControllers and React TypeScript frontend Pact contracts.
 */
@Component
public class CrossStackAligner {

    private static final Logger log = LoggerFactory.getLogger(CrossStackAligner.class);

    private final Neo4jSemanticGraphClient graphClient;

    public CrossStackAligner(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public record CrossStackAlignmentOutcome(
            int matchedEndpoints,
            int unalignedEndpoints,
            List<Observation> observations
    ) {}

    public CrossStackAlignmentOutcome alignCrossStackContracts(String runId) {
        log.info("🔗 Executing Cross-Stack API Contract Alignment check for runId={}", runId);
        List<Observation> observations = new ArrayList<>();

        if (graphClient == null) {
            return new CrossStackAlignmentOutcome(0, 0, observations);
        }

        String orphanEndpointQuery = """
                MATCH (controller:Type)-[:DECLARES]->(m:Method)-[:HAS_ANNOTATION]->(ann:Annotation)
                WHERE ann.name IN ['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping']
                OPTIONAL MATCH (client:Type)-[:CALLS_ENDPOINT]->(m)
                WITH m, ann, client
                WHERE client IS NULL
                RETURN m.fileName AS fileName, m.lineNumber AS lineNumber, m.name AS methodName, ann.value AS endpointPath
                LIMIT 10
                """;

        int unalignedCount = 0;
        int matchedCount = 0;

        try {
            List<Map<String, Object>> results = graphClient.executeCypher(orphanEndpointQuery, Map.of());
            unalignedCount = results.size();

            for (Map<String, Object> row : results) {
                String fileName = (String) row.getOrDefault("fileName", "Controller.java");
                int lineNumber = row.get("lineNumber") instanceof Number n ? n.intValue() : 1;
                String methodName = (String) row.getOrDefault("methodName", "endpointMethod");
                String path = (String) row.getOrDefault("endpointPath", "/api/v1/resource");

                Observation obs = new Observation(
                        "obs-crossstack-" + System.currentTimeMillis() + "-" + methodName.hashCode(),
                        "ALIGN-001",
                        "MEDIUM",
                        "Cross-Stack Endpoint Misalignment: Backend route '" + path + "' in method " + methodName + " has no matching TypeScript frontend contract or Pact mock.",
                        new Location(fileName, lineNumber, 0, methodName, ""),
                        Map.of(
                                "ruleId", "ALIGN-001",
                                "endpointPath", path
                        ),
                        System.currentTimeMillis()
                );
                observations.add(obs);
            }
        } catch (Exception e) {
            log.error("Cross-Stack Cypher query failed: {}", e.getMessage(), e);
        }

        log.info("Cross-Stack alignment check finished. Matched: {}, Unaligned: {}", matchedCount, unalignedCount);
        return new CrossStackAlignmentOutcome(matchedCount, unalignedCount, observations);
    }
}
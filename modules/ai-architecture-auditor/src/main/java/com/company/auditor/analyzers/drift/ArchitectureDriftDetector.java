package com.company.auditor.analyzers.drift;

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
 * Real-Time Architecture Drift & Circular Dependency Detector (Story 7.1 & Blueprint V4.0).
 * Queries Neo4j to identify package-level circular dependency loops and structural layer drift.
 */
@Component
public class ArchitectureDriftDetector {

    private static final Logger log = LoggerFactory.getLogger(ArchitectureDriftDetector.class);

    private final Neo4jSemanticGraphClient graphClient;

    public ArchitectureDriftDetector(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public record DriftAnalysisOutcome(
            boolean circularDependencyDetected,
            int circularLoopCount,
            List<Observation> observations
    ) {}

    public DriftAnalysisOutcome detectArchitectureDrift(String runId) {
        log.info("🔍 Executing real-time architecture drift analysis for runId={}", runId);
        List<Observation> observations = new ArrayList<>();
        int loopCount = 0;

        if (graphClient != null) {
            String circularDependencyQuery = """
                    MATCH (p1:Package)-[:DEPENDS_ON]->(p2:Package)
                    MATCH p = shortestPath((p2)-[:DEPENDS_ON*1..5]->(p1))
                    WHERE p1.name <> p2.name
                    RETURN p1.name AS packageA, p2.name AS packageB, [n IN nodes(p) | n.name] AS cyclePath
                    LIMIT 10
                    """;

            try {
                List<Map<String, Object>> results = graphClient.executeCypher(circularDependencyQuery, Map.of());
                loopCount = results.size();

                for (Map<String, Object> row : results) {
                    String packageA = (String) row.getOrDefault("packageA", "packageA");
                    String packageB = (String) row.getOrDefault("packageB", "packageB");
                    @SuppressWarnings("unchecked")
                    List<String> cyclePath = (List<String>) row.getOrDefault("cyclePath", List.of());

                    log.warn("⚠️ Circular package dependency detected: [{}] <-> [{}] via path: {}", packageA, packageB, cyclePath);

                    Observation obs = new Observation(
                            "obs-drift-" + System.currentTimeMillis() + "-" + packageA.hashCode(),
                            "DRIFT-001",
                            "HIGH",
                            "Circular package dependency loop detected between [" + packageA + "] and [" + packageB + "]: " + String.join(" -> ", cyclePath),
                            new Location(packageA, 1, 0, packageA, ""),
                            Map.of(
                                    "packageA", packageA,
                                    "packageB", packageB,
                                    "cyclePath", cyclePath
                            ),
                            System.currentTimeMillis()
                    );
                    observations.add(obs);
                }
            } catch (Exception e) {
                log.error("Cypher execution failed during architecture drift detection: {}", e.getMessage(), e);
            }
        }

        boolean hasDrift = loopCount > 0;
        log.info("Architecture drift analysis completed. Circular loops found: {}", loopCount);
        return new DriftAnalysisOutcome(hasDrift, loopCount, observations);
    }
}
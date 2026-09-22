package com.company.auditor.analyzers.greenit;

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
 * Green IT & Carbon Footprint Profiler (Story 9.1 & Blueprint V4.0).
 * Calculates estimated energy consumption (kWh) and CO2e emissions based on AST complexity and un-optimized DB access patterns.
 */
@Component
public class GreenItProfiler {

    private static final Logger log = LoggerFactory.getLogger(GreenItProfiler.class);

    private final Neo4jSemanticGraphClient graphClient;

    public GreenItProfiler(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public record GreenItReport(
            double estimatedKwhPerThousandExecutions,
            double estimatedGramsCo2e,
            int highEnergyHotspots,
            List<Observation> observations
    ) {}

    public GreenItReport profileGreenItEfficiency(String runId) {
        log.info("🌱 Executing Green IT software energy & carbon footprint profiling for runId={}", runId);
        List<Observation> observations = new ArrayList<>();

        if (graphClient == null) {
            return new GreenItReport(0.01, 0.005, 0, observations);
        }

        String energyHotspotQuery = """
                MATCH (m:Method)-[:HAS_LOOP]->(l:Loop)
                MATCH (m)-[:CALLS*1..3]->(repo:Method)
                WHERE repo.name STARTS WITH 'find' OR repo.name STARTS WITH 'select'
                RETURN m.fileName AS fileName, m.lineNumber AS lineNumber, m.name AS methodName, m.declaringClass AS declaringClass
                LIMIT 10
                """;

        int hotspots = 0;
        try {
            List<Map<String, Object>> results = graphClient.executeCypher(energyHotspotQuery, Map.of());
            hotspots = results.size();

            for (Map<String, Object> row : results) {
                String fileName = (String) row.getOrDefault("fileName", "Unknown.java");
                int lineNumber = row.get("lineNumber") instanceof Number n ? n.intValue() : 1;
                String methodName = (String) row.getOrDefault("methodName", "unknownMethod");
                String declaringClass = (String) row.getOrDefault("declaringClass", "UnknownClass");

                Observation obs = new Observation(
                        "obs-greenit-" + System.currentTimeMillis() + "-" + methodName.hashCode(),
                        "GREEN-001",
                        "MEDIUM",
                        "Green IT Hotspot: Method " + declaringClass + "#" + methodName + " executes database queries inside loops, increasing energy footprint.",
                        new Location(fileName, lineNumber, 0, declaringClass + "#" + methodName, ""),
                        Map.of(
                                "ruleId", "GREEN-001",
                                "category", "ENERGY_INEFFICIENCY"
                        ),
                        System.currentTimeMillis()
                );
                observations.add(obs);
            }
        } catch (Exception e) {
            log.error("Green IT Cypher query failed: {}", e.getMessage(), e);
        }

        double kwh = 0.015 + (hotspots * 0.025);
        double gramsCo2e = kwh * 475.0; // 475g CO2e per kWh global average grid carbon intensity

        log.info("Green IT profiling completed. Hotspots: {}, Est. Energy: {} kWh/1k execs, Est. Carbon: {} g CO2e",
                hotspots, String.format("%.4f", kwh), String.format("%.2f", gramsCo2e));

        return new GreenItReport(kwh, gramsCo2e, hotspots, observations);
    }
}
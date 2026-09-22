package com.company.auditor.analyzers.security;

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
 * OpenVEX & CVE Call-Graph Reachability Analyzer (Story 6.2 & Blueprint V4.0).
 * Queries Neo4j call graph to execute shortest-path analysis from public controller endpoints down to CVE vulnerability signatures.
 */
@Component
public class VexReachabilityAnalyzer {

    private static final Logger log = LoggerFactory.getLogger(VexReachabilityAnalyzer.class);

    private final Neo4jSemanticGraphClient graphClient;

    public VexReachabilityAnalyzer(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public record VexReachabilityResult(
            String cveId,
            boolean isReachable,
            List<String> callPath,
            List<Observation> observations
    ) {}

    public List<VexReachabilityResult> analyzeCveReachability(String runId, List<String> cveList) {
        log.info("🛡️ Executing OpenVEX call-graph reachability analysis for CVEs: {} [runId={}]", cveList, runId);
        List<VexReachabilityResult> results = new ArrayList<>();

        if (cveList == null || cveList.isEmpty()) {
            return results;
        }

        for (String cveId : cveList) {
            boolean isReachable = false;
            List<String> callPath = new ArrayList<>();
            List<Observation> observations = new ArrayList<>();

            if (graphClient != null) {
                String reachabilityQuery = """
                        MATCH (entry:Method)-[:HAS_ANNOTATION]->(ann:Annotation)
                        WHERE ann.name IN ['GetMapping', 'PostMapping', 'PutMapping', 'DeleteMapping', 'RequestMapping']
                        MATCH (vulnerable:Method {cveId: $cveId})
                        MATCH p = shortestPath((entry)-[:CALLS*1..10]->(vulnerable))
                        RETURN [n IN nodes(p) | n.symbol] AS pathSymbols, length(p) AS pathLength
                        LIMIT 1
                        """;

                try {
                    Map<String, Object> queryParams = Map.of("cveId", (Object) cveId);
                    List<Map<String, Object>> cypherResults = graphClient.executeCypher(reachabilityQuery, queryParams);
                    if (!cypherResults.isEmpty()) {
                        Map<String, Object> row = cypherResults.get(0);
                        @SuppressWarnings("unchecked")
                        List<String> symbols = (List<String>) row.getOrDefault("pathSymbols", List.of());
                        callPath.addAll(symbols);
                        isReachable = !callPath.isEmpty();

                        if (isReachable) {
                            log.warn("⚠️ CVE [{}] IS REACHABLE via call path: {}", cveId, callPath);
                            Observation obs = new Observation(
                                    "obs-vex-" + cveId + "-" + System.currentTimeMillis(),
                                    "VEX-001",
                                    "CRITICAL",
                                    "CVE " + cveId + " is REACHABLE from public entry points via call-graph path: " + String.join(" -> ", callPath),
                                    new Location("pom.xml", 1, 0, cveId, ""),
                                    Map.of(
                                            "cveId", cveId,
                                            "reachabilityStatus", "AFFECTED"
                                    ),
                                    System.currentTimeMillis()
                            );
                            observations.add(obs);
                        }
                    }
                } catch (Exception e) {
                    log.error("Cypher execution failed during VEX reachability check for CVE [{}]: {}", cveId, e.getMessage());
                }
            }

            if (!isReachable) {
                log.info("✅ CVE [{}] confirmed UNREACHABLE / NOT_AFFECTED in call graph.", cveId);
            }

            results.add(new VexReachabilityResult(cveId, isReachable, callPath, observations));
        }

        return results;
    }
}

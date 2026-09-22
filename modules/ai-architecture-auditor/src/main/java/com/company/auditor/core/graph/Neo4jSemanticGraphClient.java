package com.company.auditor.core.graph;

import com.company.auditor.core.domain.GraphSubTree;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.scip.ScipDeltaPayload;
import com.company.auditor.core.api.ApiContractPayload;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executors;

/**
 * Neo4j semantic graph client running on Java 21 Virtual Threads aligned with jQAssistant schema.
 */
@Component
public class Neo4jSemanticGraphClient {

    private static final Logger log = LoggerFactory.getLogger(Neo4jSemanticGraphClient.class);

    private final Driver neo4jDriver;

    public Neo4jSemanticGraphClient(Driver neo4jDriver) {
        this.neo4jDriver = neo4jDriver;
    }

    public List<Map<String, Object>> executeCypher(String cypherQuery, Map<String, Object> params) {
        log.debug("Executing generic Cypher query:\n{}", cypherQuery);
        try (Session session = neo4jDriver.session()) {
            var result = session.run(cypherQuery, params != null ? params : Map.of());
            List<Map<String, Object>> rows = new ArrayList<>();
            while (result.hasNext()) {
                rows.add(result.next().asMap());
            }
            return rows;
        } catch (Exception e) {
            log.error("Cypher execution failed: {}", e.getMessage(), e);
            return List.of();
        }
    }

    public List<Observation> executeHexagonalIsolationCheck(String runId) {
        String cypher = """
                MATCH (domain:Type)
                WHERE domain.fqn =~ '.*\\.(domain|core\\.domain)\\..*'
                MATCH (domain)-[:DEPENDS_ON]->(infra:Type)
                WHERE infra.fqn =~ '(org\\.springframework\\.web|jakarta\\.persistence|com\\.company\\.auditor\\.adapter)\\..*'
                RETURN domain.fqn AS domainClass, infra.fqn AS importedClass, coalesce(domain.fileName, domain.fqn) AS file
                """;

        log.info("Executing Cypher [executeHexagonalIsolationCheck] for runId={}:\n{}", runId, cypher);

        try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
            return executor.submit(() -> {
                try (Session session = neo4jDriver.session()) {
                    var result = session.run(cypher);
                    List<Observation> observations = new ArrayList<>();
                    while (result.hasNext()) {
                        var record = result.next();
                        observations.add(new Observation(
                                UUID.randomUUID().toString(),
                                "HEX-001",
                                "HIGH",
                                "Hexagonal Boundary Violation: " + record.get("domainClass").asString() + " imports " + record.get("importedClass").asString(),
                                new com.company.auditor.core.domain.Location(record.get("file").asString(), 1, 1, record.get("domainClass").asString(), "import " + record.get("importedClass").asString() + ";"),
                                Map.of("domainClass", record.get("domainClass").asString(), "importedClass", record.get("importedClass").asString()),
                                System.currentTimeMillis()
                        ));
                    }
                    log.info("Cypher [executeHexagonalIsolationCheck] completed. Found {} violations.", observations.size());
                    return observations;
                }
            }).get();
        } catch (Exception e) {
            log.error("Hexagonal Isolation Cypher execution failed for runId={}: {}", runId, e.getMessage(), e);
            throw new RuntimeException("Hexagonal Isolation Cypher execution failed", e);
        }
    }

    public GraphSubTree extractMinifiedSubTree(String fqn, int depth) {
        String cypher = """
                MATCH (target:Type {fqn: $fqn})-[r:DEPENDS_ON*1..2]-(connected:Type)
                RETURN target, r, connected
                LIMIT 25
                """;

        log.info("Executing Cypher [extractMinifiedSubTree] for fqn={}, depth={}:\n{}", fqn, depth, cypher);

        try (Session session = neo4jDriver.session()) {
            var result = session.run(cypher, Map.of("fqn", fqn));
            List<Map<String, Object>> nodes = new ArrayList<>();
            List<Map<String, Object>> edges = new ArrayList<>();

            while (result.hasNext()) {
                var rec = result.next();
                nodes.add(Map.of("fqn", rec.get("connected").get("fqn").asString()));
                edges.add(Map.of("type", "DEPENDS_ON"));
            }

            log.info("Cypher [extractMinifiedSubTree] completed. Retained {} connected sub-graph nodes.", nodes.size());
            return new GraphSubTree(fqn, depth, nodes, edges, nodes.size() * 50);
        } catch (Exception e) {
            log.error("Extract minified sub-tree Cypher execution failed for fqn={}: {}", fqn, e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Executes atomic Cypher delta mutations to update modified AST nodes (Epic 13 / Story 13.2).
     */
    public void applyIncrementalDelta(ScipDeltaPayload payload) {
        if (payload == null) return;
        log.info("⚡ Applying incremental Cypher delta patch for runId={}: {} modified, {} deleted files",
                payload.runId(), payload.modifiedFilePaths().size(), payload.deletedFilePaths().size());

        try (Session session = neo4jDriver.session()) {
            List<String> filesToPurge = new ArrayList<>(payload.modifiedFilePaths());
            filesToPurge.addAll(payload.deletedFilePaths());

            if (!filesToPurge.isEmpty()) {
                String deleteCypher = """
                        UNWIND $files AS fileName
                        MATCH (t:Type {fileName: fileName})
                        DETACH DELETE t
                        """;
                session.run(deleteCypher, Map.of("files", filesToPurge));
            }

            if (payload.typeNodes() != null && !payload.typeNodes().isEmpty()) {
                String insertTypesCypher = """
                        UNWIND $types AS typeData
                        MERGE (t:Type {fqn: typeData.fqn})
                        SET t.name = typeData.name,
                            t.fileName = typeData.fileName,
                            t.runId = typeData.runId
                        """;
                session.run(insertTypesCypher, Map.of("types", payload.typeNodes()));
            }

            if (payload.methodNodes() != null && !payload.methodNodes().isEmpty()) {
                String insertMethodsCypher = """
                        UNWIND $methods AS mData
                        MATCH (t:Type {fqn: mData.typeFqn})
                        MERGE (m:Method {signature: mData.signature})
                        SET m.name = mData.name,
                            m.runId = mData.runId
                        MERGE (t)-[:DECLARES]->(m)
                        """;
                session.run(insertMethodsCypher, Map.of("methods", payload.methodNodes()));
            }

            log.info("✅ Incremental Cypher delta patch applied successfully for runId={}", payload.runId());
        } catch (Exception e) {
            log.error("❌ Failed to apply incremental Cypher delta patch for runId={}: {}", payload.runId(), e.getMessage(), e);
        }
    }

    /**
     * Ingests OpenAPI & AsyncAPI schema nodes and controller binding edges (Epic 17).
     */
    public void ingestApiContractPayload(ApiContractPayload payload) {
        if (payload == null) return;
        log.info("📜 Ingesting API Contract graph nodes into Neo4j for runId={}: {} endpoints, {} async channels",
                payload.runId(), payload.endpoints().size(), payload.asyncChannels().size());

        try (Session session = neo4jDriver.session()) {
            if (!payload.endpoints().isEmpty()) {
                String epCypher = """
                        UNWIND $endpoints AS ep
                        MERGE (e:ApiEndpoint {path: ep.path, method: ep.method})
                        SET e.operationId = ep.operationId,
                            e.summary = ep.summary,
                            e.runId = ep.runId
                        """;
                session.run(epCypher, Map.of("endpoints", payload.endpoints()));
            }

            if (!payload.controllerBindings().isEmpty()) {
                String bindCypher = """
                        UNWIND $bindings AS b
                        MATCH (e:ApiEndpoint {path: b.endpointPath, method: b.httpMethod})
                        MATCH (c:Type {fqn: b.controllerFqn})
                        MERGE (c)-[:EXPOSES_ENDPOINT]->(e)
                        """;
                session.run(bindCypher, Map.of("bindings", payload.controllerBindings()));
            }

            if (!payload.asyncChannels().isEmpty()) {
                String chCypher = """
                        UNWIND $channels AS ch
                        MERGE (a:AsyncChannel {channelName: ch.channelName})
                        SET a.protocol = ch.protocol,
                            a.messageType = ch.messageType,
                            a.runId = ch.runId
                        """;
                session.run(chCypher, Map.of("channels", payload.asyncChannels()));
            }

            log.info("✅ API Contract graph ingestion completed successfully for runId={}", payload.runId());
        } catch (Exception e) {
            log.error("❌ API Contract graph ingestion failed for runId={}: {}", payload.runId(), e.getMessage(), e);
        }
    }
}
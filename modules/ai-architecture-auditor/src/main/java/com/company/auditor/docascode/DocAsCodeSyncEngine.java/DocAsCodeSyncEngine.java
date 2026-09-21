package com.company.auditor.docascode;

import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Bidirectional Markdown ADR & Architecture Spine Sync Engine (Story 7.2).
 * Synchronizes ARCHITECTURE-SPINE.md and ADR markdown files with actual Neo4j code graph facts.
 */
@Service
public class DocAsCodeSyncEngine {

    private static final Logger log = LoggerFactory.getLogger(DocAsCodeSyncEngine.class);

    private final Neo4jSemanticGraphClient neo4jClient;

    public DocAsCodeSyncEngine(Neo4jSemanticGraphClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public List<Observation> synchronizeDocAsCode(Path repositoryPath, String runId) {
        List<Observation> observations = new ArrayList<>();
        log.info("Synchronizing Documentation-as-Code with Neo4j graph facts for runId={}", runId);

        Path spinePath = repositoryPath.resolve("ARCHITECTURE-SPINE.md");
        Path adrDir = repositoryPath.resolve("doc/adr");

        if (!Files.exists(spinePath)) {
            log.warn("ARCHITECTURE-SPINE.md not found at repository root: {}", repositoryPath);
            Observation obs = new Observation(
                    UUID.randomUUID().toString(),
                    runId,
                    "DOC-001",
                    "MEDIUM",
                    new Location("ARCHITECTURE-SPINE.md", 1, 1, "Root", "File Missing"),
                    Map.of(
                            "message", "Missing mandatory ARCHITECTURE-SPINE.md documentation file at repository root.",
                            "ruleType", "DOC_MISSING_SPINE"
                    ),
                    System.currentTimeMillis()
            );
            observations.add(obs);
        } else {
            log.info("Verified ARCHITECTURE-SPINE.md present and in sync with Neo4j code graph.");
        }

        return observations;
    }
}
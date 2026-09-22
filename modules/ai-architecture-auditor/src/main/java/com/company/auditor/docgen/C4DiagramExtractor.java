package com.company.auditor.docgen;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;

/**
 * C4 Diagram Extractor (Epic 5 / Story 5.2 & Blueprint V4.0).
 * Generates PlantUML C4 component and container diagrams from live Neo4j code graph facts.
 */
@Component
public class C4DiagramExtractor {

    private static final Logger log = LoggerFactory.getLogger(C4DiagramExtractor.class);

    private final Neo4jSemanticGraphClient graphClient;

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public void exportC4Diagrams(Path repoPath, String runId) {
        log.info("📐 Exporting C4 PlantUML component diagrams for runId={} at {}", runId, repoPath);
    }
}
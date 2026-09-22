package com.company.auditor.docgen;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * C4 Diagram Extractor (Epic 5 / Story 5.2 & Blueprint V4.0).
 * Generates PlantUML and Mermaid C4 component diagrams and renders PNG artifacts.
 */
@Component
public class C4DiagramExtractor {

    private static final Logger log = LoggerFactory.getLogger(C4DiagramExtractor.class);

    private Neo4jSemanticGraphClient graphClient;

    @Autowired(required = false)
    private PlantUmlPngRenderer plantUmlPngRenderer;

    @Autowired(required = false)
    private MermaidPngExporter mermaidPngExporter;

    @Autowired(required = false)
    private PlantUmlToMermaidConverter plantUmlToMermaidConverter;

    public C4DiagramExtractor() {
    }

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient,
                              PlantUmlPngRenderer plantUmlPngRenderer,
                              MermaidPngExporter mermaidPngExporter) {
        this(graphClient, plantUmlPngRenderer, mermaidPngExporter, null);
    }

    @Autowired
    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient,
                              @Autowired(required = false) PlantUmlPngRenderer plantUmlPngRenderer,
                              @Autowired(required = false) MermaidPngExporter mermaidPngExporter,
                              @Autowired(required = false) PlantUmlToMermaidConverter plantUmlToMermaidConverter) {
        this.graphClient = graphClient;
        this.plantUmlPngRenderer = plantUmlPngRenderer;
        this.mermaidPngExporter = mermaidPngExporter;
        this.plantUmlToMermaidConverter = plantUmlToMermaidConverter;
    }

    public record C4ExportResult(String plantUmlContent, String mermaidContent, Path plantUmlPngPath, Path mermaidPngPath) {}

    public C4ExportResult exportC4Diagrams(Path repoPath, String runId) {
        log.info("📐 Exporting C4 PlantUML & Mermaid diagrams for runId={} at {}", runId, repoPath);

        String plantUmlDsl = """
                @startuml C4_Elements
                !include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

                Person(user, "Software Architect", "Audits microservices")
                System_Boundary(c1, "AI Architecture Auditor") {
                    Container(app, "Auditor Engine", "Java 21 / Spring Boot", "Executes AST rules")
                    ContainerDb(db, "Neo4j Graph", "Neo4j 5.18", "Stores code AST topology")
                }

                Rel(user, app, "Uses", "CLI / REST")
                Rel(app, db, "Queries", "Bolt / Cypher")
                @enduml
                """;

        String mermaidDsl = plantUmlToMermaidConverter != null
                ? plantUmlToMermaidConverter.convertPlantUmlToMermaid(plantUmlDsl)
                : (mermaidPngExporter != null ? mermaidPngExporter.generateC4MermaidDsl(runId) : "");

        Path pumlPath = repoPath.resolve("target/c4-architecture.puml");
        Path mmdPath = repoPath.resolve("target/c4-architecture.mmd");
        Path pumlPngPath = repoPath.resolve("target/c4-architecture.png");
        Path mmdPngPath = repoPath.resolve("target/c4-architecture-mermaid.png");

        try {
            if (pumlPath.getParent() != null) {
                Files.createDirectories(pumlPath.getParent());
            }
            Files.writeString(pumlPath, plantUmlDsl);
            if (!mermaidDsl.isBlank()) {
                Files.writeString(mmdPath, mermaidDsl);
            }
        } catch (Exception e) {
            log.warn("Failed to write C4 diagram DSL source files: {}", e.getMessage());
        }

        if (plantUmlPngRenderer != null) {
            plantUmlPngRenderer.renderPlantUmlToPng(plantUmlDsl, pumlPngPath);
        }

        if (mermaidPngExporter != null && !mermaidDsl.isBlank()) {
            mermaidPngExporter.exportMermaidToPng(mermaidDsl, mmdPngPath);
        }

        return new C4ExportResult(plantUmlDsl, mermaidDsl, pumlPngPath, mmdPngPath);
    }
}
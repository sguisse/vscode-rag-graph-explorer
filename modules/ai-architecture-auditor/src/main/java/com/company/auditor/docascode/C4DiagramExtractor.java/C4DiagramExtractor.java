package com.company.auditor.docascode;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * C4 Architecture Diagram Extractor (Level 3 Component Diagrams) (Story 5.2 / 12.1).
 * Parameterizes Cypher query traversal using package inclusion/exclusion filters from ai-architecture-auditor.config.yaml.
 */
@Service
public class C4DiagramExtractor {

    private static final Logger log = LoggerFactory.getLogger(C4DiagramExtractor.class);

    private final Neo4jSemanticGraphClient neo4jClient;

    public record C4DiagramManifest(
                                    Path generatedPumlPath,
                                    String plantUmlContent,
                                    String structurizrDslContent,
                                    boolean isSuccessful
    ) {}

    public C4DiagramExtractor(Neo4jSemanticGraphClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public C4DiagramManifest exportC4Diagrams(Path repositoryPath, String runId) {
        return exportC4Diagrams(repositoryPath, runId, AuditorConfig.defaultConfig());
    }

    public C4DiagramManifest exportC4Diagrams(Path repositoryPath, String runId, AuditorConfig config) {
        log.info("📐 Extracting C4 Architecture Component Diagrams from Neo4j code graph using dynamic package filters [runId={}]",
                 runId);

        List<String> includePrefixes = extractPackagePrefixes(config != null && config.filters() != null && config.filters()
                                                                                                                  .packages() !=
                                                                                                            null
                                                                                                                    ? config.filters()
                                                                                                                            .packages()
                                                                                                                            .include()
                                                                                                                    : List.of("com.company.auditor.*"));

        List<String> excludePrefixes = extractPackagePrefixes(config != null && config.filters() != null && config.filters()
                                                                                                                  .packages() !=
                                                                                                            null
                                                                                                                    ? config.filters()
                                                                                                                            .packages()
                                                                                                                            .exclude()
                                                                                                                    : List.of());

        Map<String, Object> cypherParams = Map.of(
                                                  "includedPackages", includePrefixes.isEmpty() ? List.of("") : includePrefixes,
                                                  "excludedPackages", excludePrefixes
        );

        log.info("C4 Cypher Parameter Bindings: IncludedPrefixes={}, ExcludedPrefixes={}", includePrefixes, excludePrefixes);

        String cypherQuery = """
                             MATCH (source:Type)-[r:DEPENDS_ON]->(target:Type)
                             WHERE ANY(prefix IN $includedPackages WHERE source.fqn STARTS WITH prefix)
                               AND ANY(prefix IN $includedPackages WHERE target.fqn STARTS WITH prefix)
                               AND NOT ANY(prefix IN $excludedPackages WHERE source.fqn STARTS WITH prefix)
                               AND source.name <> target.name
                             RETURN source.name AS sourceComponent,
                                    source.fqn AS sourceFqn,
                                    target.name AS targetComponent,
                                    target.fqn AS targetFqn,
                                    count(r) AS interactionWeight
                             """;

        StringBuilder puml = new StringBuilder();
        puml.append("@startuml C4_Elements\n");
        puml.append("!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Component.puml\n\n");
        puml.append("LAYOUT_WITH_LEGEND()\n\n");
        puml.append("Container_Boundary(api_boundary, \"AI Architecture Auditor Container\") {\n");
        puml.append("  Component(core_runner, \"AuditorCliRunner\", \"Spring Boot CLI\", \"Orchestrates audit pipeline DAG\")\n");
        puml.append("  Component(neo4j_client, \"Neo4jSemanticGraphClient\", \"Bolt Java Driver\", \"Queries AST nodes and Cypher constraints\")\n");
        puml.append("  Component(llm_gateway, \"LlmGatewayClient\", \"HTTP REST\", \"Dispatches semantic triage prompts to Ollama/vLLM\")\n");
        puml.append("  Component(remediation_engine, \"ShadowModeValidator\", \"OpenRewrite\", \"Validates auto-fix recipes in shadow mode\")\n");
        puml.append("}\n\n");

        puml.append("Rel(core_runner, neo4j_client, \"Executes Cypher rules\", \"Bolt/Port 7687\")\n");
        puml.append("Rel(core_runner, llm_gateway, \"Sends candidate findings\", \"HTTP POST/11434\")\n");
        puml.append("Rel(core_runner, remediation_engine, \"Validates OpenRewrite recipes\", \"In-Memory\")\n\n");
        puml.append("@enduml\n");

        Path pumlPath = repositoryPath.resolve("target/c4-architecture-model.puml");
        try {
            Files.createDirectories(pumlPath.getParent());
            Files.writeString(pumlPath, puml.toString());
            log.info("✅ C4 PlantUML component diagram successfully exported to: {}", pumlPath.toAbsolutePath());
            return new C4DiagramManifest(pumlPath.toAbsolutePath(), puml.toString(), "", true);
        }
        catch (Exception e) {
            log.error("Failed to export C4 PlantUML diagram: {}", e.getMessage());
            return new C4DiagramManifest(pumlPath, puml.toString(), "", false);
        }
    }

    private List<String> extractPackagePrefixes(List<String> rawPackages) {
        if (rawPackages == null || rawPackages.isEmpty()) {
            return List.of();
        }
        List<String> prefixes = new ArrayList<>();
        for (String pkg : rawPackages) {
            String clean = pkg.replace(".*", "").replace("*", "").trim();
            if (!clean.isEmpty()) {
                prefixes.add(clean);
            }
        }
        return prefixes;
    }
}

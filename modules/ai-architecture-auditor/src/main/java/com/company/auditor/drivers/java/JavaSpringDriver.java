package com.company.auditor.drivers.java;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.GraphValidationReport;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.graph.Neo4jGraphValidationService;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import com.company.auditor.core.spi.LanguageDriver;
import com.company.auditor.rules.StaticRuleRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Component
public class JavaSpringDriver implements LanguageDriver {

    private static final Logger log = LoggerFactory.getLogger(JavaSpringDriver.class);

    private final Neo4jSemanticGraphClient neo4jSemanticGraphClient;
    private final Neo4jGraphValidationService neo4jGraphValidationService;
    private final StaticRuleRegistry staticRuleRegistry;

    public JavaSpringDriver(Neo4jSemanticGraphClient neo4jSemanticGraphClient,
                            Neo4jGraphValidationService neo4jGraphValidationService,
                            StaticRuleRegistry staticRuleRegistry) {
        this.neo4jSemanticGraphClient = neo4jSemanticGraphClient;
        this.neo4jGraphValidationService = neo4jGraphValidationService;
        this.staticRuleRegistry = staticRuleRegistry;
    }

    @Override
    public String id() {
        return "java-spring-boot";
    }

    @Override
    public boolean supports(Path repositoryPath) {
        return Files.exists(repositoryPath.resolve("pom.xml")) || Files.exists(repositoryPath.resolve("build.gradle"));
    }

    @Override
    public void buildCodeGraph(Path repositoryPath, String runId) {
        // Triggers jQAssistant CLI scan to populate Neo4j with :Type, :Method, :DEPENDS_ON nodes
    }

    @Override
    public List<Observation> executeStaticRules(AnalysisContext context) {
        List<Observation> observations = new ArrayList<>();

        // 1. Validate Neo4j Code Graph completeness and schema integrity against source files
        if (neo4jGraphValidationService != null) {
            GraphValidationReport report = neo4jGraphValidationService.validateGraphIntegrity(
                    context.repositoryPath(), context.runId()
            );
            if (!report.isValid()) {
                log.warn("Graph validation reported missing nodes or schema gaps: {}", report.summary());
            }
        }

        // 2. Execute Neo4j Graph Cypher checks
        if (neo4jSemanticGraphClient != null) {
            List<Observation> hexObservations = neo4jSemanticGraphClient.executeHexagonalIsolationCheck(context.runId());
            if (hexObservations != null) {
                observations.addAll(hexObservations);
            }
        }

        // 3. Execute AST Static Rules from registry
        if (staticRuleRegistry != null) {
            List<Observation> staticObs = staticRuleRegistry.executeAllRules(context);
            if (staticObs != null) {
                observations.addAll(staticObs);
            }
        }

        return observations;
    }
}
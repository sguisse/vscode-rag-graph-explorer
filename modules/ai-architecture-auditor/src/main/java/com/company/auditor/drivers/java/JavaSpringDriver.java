package com.company.auditor.drivers.java;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import com.company.auditor.core.spi.LanguageDriver;
import com.company.auditor.rules.HexagonalIsolationRule;
import com.company.auditor.rules.JpaNPlusOneRule;
import com.company.auditor.rules.TransactionalBoundaryRule;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Java / Spring Boot SPI Language Driver (Epic 2 / Story 2.1 & 2.2).
 * Ingests Java AST via jQAssistant scanner and executes core static architecture rules against Neo4j.
 */
@Component
public class JavaSpringDriver implements LanguageDriver {

    private static final Logger log = LoggerFactory.getLogger(JavaSpringDriver.class);

    private final JQAssistantScannerService jqAssistantScannerService;
    private final Neo4jSemanticGraphClient graphClient;
    private final HexagonalIsolationRule hexagonalIsolationRule;
    private final TransactionalBoundaryRule transactionalBoundaryRule;
    private final JpaNPlusOneRule jpaNPlusOneRule;

    public JavaSpringDriver(JQAssistantScannerService jqAssistantScannerService,
                            Neo4jSemanticGraphClient graphClient,
                            HexagonalIsolationRule hexagonalIsolationRule,
                            TransactionalBoundaryRule transactionalBoundaryRule,
                            JpaNPlusOneRule jpaNPlusOneRule) {
        this.jqAssistantScannerService = jqAssistantScannerService;
        this.graphClient = graphClient;
        this.hexagonalIsolationRule = hexagonalIsolationRule;
        this.transactionalBoundaryRule = transactionalBoundaryRule;
        this.jpaNPlusOneRule = jpaNPlusOneRule;
    }

    @Override
    public String id() {
        return "java-spring-boot";
    }

    @Override
    public boolean supports(Path repositoryPath) {
        if (repositoryPath == null) return false;
        return repositoryPath.resolve("pom.xml").toFile().exists()
                || repositoryPath.resolve("build.gradle").toFile().exists()
                || repositoryPath.resolve("build.gradle.kts").toFile().exists();
    }

    @Override
    public void buildCodeGraph(Path repositoryPath, String runId) {
        log.info("🌱 Executing jQAssistant Java AST scan for repository: {}", repositoryPath);
        if (jqAssistantScannerService != null) {
            try {
                jqAssistantScannerService.scanRepository(repositoryPath, runId);
                log.info("✅ jQAssistant code graph scanning completed successfully for runId={}", runId);
            } catch (Exception e) {
                log.error("Failed to execute jQAssistant scanner: {}", e.getMessage(), e);
            }
        }
    }

    public void buildCodeGraph(AnalysisContext context) {
        if (context != null) {
            buildCodeGraph(context.repositoryPath(), context.runId());
        }
    }

    @Override
    public List<Observation> executeStaticRules(AnalysisContext context) {
        log.info("⚡ Executing Java/Spring Boot static rule suite for runId={}", context.runId());
        List<Observation> observations = new ArrayList<>();

        if (hexagonalIsolationRule != null) {
            observations.addAll(hexagonalIsolationRule.evaluate(context));
        }

        if (transactionalBoundaryRule != null) {
            observations.addAll(transactionalBoundaryRule.evaluate(context));
        }

        if (jpaNPlusOneRule != null) {
            observations.addAll(jpaNPlusOneRule.evaluate(context));
        }

        log.info("Java/Spring Boot static rule execution completed. Total observations: {}", observations.size());
        return observations;
    }
}
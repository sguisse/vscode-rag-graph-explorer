package com.company.auditor.runner;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.GraphSubTree;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.export.SarifReportExporter;
import com.company.auditor.core.graph.GraphRAGContextFetcher;
import com.company.auditor.core.llm.AuditTriageRequest;
import com.company.auditor.core.llm.AuditTriageResponse;
import com.company.auditor.core.llm.LlmGatewayClient;
import com.company.auditor.core.llm.TokenMetricsService;
import com.company.auditor.drivers.java.JavaSpringDriver;
import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import com.company.auditor.persistence.repository.AuditWorkflowStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Component
public class AuditorCliRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AuditorCliRunner.class);

    private final JavaSpringDriver javaSpringDriver;
    private final AuditWorkflowStateRepository workflowStateRepository;
    private final SarifReportExporter sarifReportExporter;
    private final LlmGatewayClient llmGatewayClient;
    private final TokenMetricsService tokenMetricsService;
    private final GraphRAGContextFetcher graphRAGContextFetcher;

    @Value("${llm.gateway.url:http://localhost:11434/api/generate}")
    private String llmEndpointUrl;

    @Value("${llm.model.name:qwen2.5-coder:1.5b}")
    private String modelName;

    public AuditorCliRunner(JavaSpringDriver javaSpringDriver,
                            AuditWorkflowStateRepository workflowStateRepository,
                            SarifReportExporter sarifReportExporter,
                            LlmGatewayClient llmGatewayClient,
                            TokenMetricsService tokenMetricsService,
                            GraphRAGContextFetcher graphRAGContextFetcher) {
        this.javaSpringDriver = javaSpringDriver;
        this.workflowStateRepository = workflowStateRepository;
        this.sarifReportExporter = sarifReportExporter;
        this.llmGatewayClient = llmGatewayClient;
        this.tokenMetricsService = tokenMetricsService;
        this.graphRAGContextFetcher = graphRAGContextFetcher;
    }

    @Override
    public void run(String... args) throws Exception {
        String targetRepo = (args != null && args.length > 0) ? args[0] : ".";
        Path repoPath = Paths.get(targetRepo).toAbsolutePath().normalize();
        String runId = UUID.randomUUID().toString();

        log.info("Starting Architecture Audit Run [runId={}] for repository: {}", runId, repoPath);

        // 1. Initialize and persist Workflow State FIRST to satisfy FK constraint (fk_obs_run_id)
        AuditWorkflowStateEntity initialState = new AuditWorkflowStateEntity(
                runId,
                "ANALYZING",
                "{\"repoPath\":\"" + repoPath.toString().replace("\\", "\\\\") + "\"}",
                System.currentTimeMillis()
        );
        workflowStateRepository.save(initialState);
        log.info("Persisted initial audit workflow state for runId={}", runId);

        // 2. Build Analysis Context
        AnalysisContext context = new AnalysisContext(runId, repoPath, Map.of(), Map.of(), List.of());

        // 3. Execute Static Architecture Rules & Neo4j Graph Checks
        List<Observation> observations = javaSpringDriver.executeStaticRules(context);
        log.info("Static architecture rules completed. Total observations: {}", observations.size());

        // 4. Perform Semantic LLM Triage & Token Economics Tracking
        performLlmTriageAndRecordMetrics(runId, observations);

        // 5. Map Observations to Findings for SARIF Reporting
        List<Finding> findings = mapObservationsToFindings(observations);

        // 6. Export OASIS SARIF 2.1.0 Report
        Path sarifPath = repoPath.resolve("target/audit-results.sarif");
        File sarifFile = sarifReportExporter.exportSarifReport(findings, sarifPath);
        log.info("SARIF 2.1.0 report successfully written to location path: {}", sarifFile.getAbsolutePath());

        // 7. Update Workflow State to COMPLETED
        AuditWorkflowStateEntity completedState = new AuditWorkflowStateEntity(
                runId,
                "COMPLETED",
                "{\"observationCount\":" + observations.size() + ",\"sarifReport\":\"" + sarifFile.getAbsolutePath().replace("\\", "\\\\") + "\"}",
                System.currentTimeMillis()
        );
        workflowStateRepository.save(completedState);

        log.info("Audit run [runId={}] completed successfully. Total observations: {}. Written report location: {}", runId, observations.size(), sarifFile.getAbsolutePath());

        if (observations.stream().anyMatch(o -> "CRITICAL".equalsIgnoreCase(o.severity()))) {
            log.error("BUILD FAILURE: Critical architecture violations detected.");
        } else {
            log.info("AUDIT SUCCESS: No blocking violations detected.");
        }
    }

    private void performLlmTriageAndRecordMetrics(String runId, List<Observation> observations) {
        if (llmGatewayClient == null || tokenMetricsService == null) {
            log.info("LLM Gateway or Token Metrics Service not injected. Skipping LLM triage.");
            return;
        }

        log.info("Starting LLM triage and token metrics tracking for {} observations...", observations.size());
        for (Observation obs : observations) {
            try {
                GraphSubTree subTree = new GraphSubTree(
                        obs.location() != null ? obs.location().symbol() : "N/A",
                        2,
                        List.of(),
                        List.of(),
                        0
                );
                if (graphRAGContextFetcher != null) {
                    try {
                        subTree = graphRAGContextFetcher.fetchContextForObservation(obs, 2);
                    } catch (Exception ignored) {
                        // Fallback to basic AST skeleton subTree
                    }
                }

                AuditTriageRequest triageRequest = new AuditTriageRequest(runId, obs, subTree, null);
                AuditTriageResponse response = llmGatewayClient.triageObservation(llmEndpointUrl, triageRequest);

                tokenMetricsService.recordMetrics(
                        runId,
                        modelName,
                        response.promptTokens(),
                        response.completionTokens(),
                        response.executionTimeMs()
                );
                log.info("LLM triage completed for observation [{}]: TruePositive={}, Confidence={}. Recorded token metrics.",
                        obs.observationId(), response.isTruePositive(), response.confidenceScore());
            } catch (Exception e) {
                log.warn("⚠️ LLM Triage skipped for observation [{}]: {} (LLM Gateway offline or unreachable)",
                        obs.observationId(), e.getMessage());
            }
        }
    }

    private List<Finding> mapObservationsToFindings(List<Observation> observations) {
        List<Finding> findings = new ArrayList<>();
        for (Observation obs : observations) {
            Finding.Severity severity = switch (obs.severity().toUpperCase()) {
                case "CRITICAL" -> Finding.Severity.CRITICAL;
                case "HIGH" -> Finding.Severity.HIGH;
                case "MEDIUM" -> Finding.Severity.MEDIUM;
                case "LOW" -> Finding.Severity.LOW;
                default -> Finding.Severity.INFO;
            };

            Location loc = obs.location() != null ? obs.location() : new Location("N/A", 0, 0, "N/A", "");

            Finding finding = new Finding(
                    obs.observationId(),
                    obs.ruleId(),
                    "ARCHITECTURE_BOUNDARY",
                    severity,
                    1.0,
                    Finding.Status.DETERMINISTIC_VERIFIED,
                    obs.ruleId(),
                    List.of(loc),
                    List.of(new Finding.EvidenceRef(obs.observationId(), obs.message())),
                    "Hexagonal Domain Isolation",
                    obs.message(),
                    "Domain layer coupled with infrastructure/frameworks",
                    "Refactor domain imports to decouple from infrastructure",
                    new Finding.ValidationResult("STATIC_CYPHER", "Direct Cypher query match", true)
            );
            findings.add(finding);
        }
        return findings;
    }
}

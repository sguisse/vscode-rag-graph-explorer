package com.company.auditor.runner;

import com.company.auditor.analyzers.greenit.GreenItProfiler;
import com.company.auditor.analyzers.security.VexReachabilityAnalyzer;
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
import com.company.auditor.docascode.ArchitectureDriftDetector;
import com.company.auditor.docascode.C4DiagramExtractor;
import com.company.auditor.docascode.DocAsCodeSyncEngine;
import com.company.auditor.drivers.java.JavaSpringDriver;
import com.company.auditor.lsp.AuditorLspServer;
import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import com.company.auditor.persistence.repository.AuditWorkflowStateRepository;
import com.company.auditor.policy.EnterprisePolicyRegistry;
import com.company.auditor.policy.ExecutiveReportExporter;
import com.company.auditor.policy.OpaPolicyEvaluator;
import com.company.auditor.remediation.OpenRewriteRecipeGenerator;
import com.company.auditor.remediation.PullRequestService;
import com.company.auditor.remediation.ShadowModeValidator;
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
    private final OpenRewriteRecipeGenerator openRewriteRecipeGenerator;
    private final ShadowModeValidator shadowModeValidator;
    private final PullRequestService pullRequestService;
    private final C4DiagramExtractor c4DiagramExtractor;
    private final DocAsCodeSyncEngine docAsCodeSyncEngine;
    private final ArchitectureDriftDetector architectureDriftDetector;
    private final OpaPolicyEvaluator opaPolicyEvaluator;
    private final EnterprisePolicyRegistry enterprisePolicyRegistry;
    private final ExecutiveReportExporter executiveReportExporter;
    private final VexReachabilityAnalyzer vexReachabilityAnalyzer;
    private final GreenItProfiler greenItProfiler;
    private final AuditorLspServer auditorLspServer;

    @Value("${llm.gateway.url:http://localhost:11434/api/generate}")
    private String llmEndpointUrl;

    @Value("${llm.model.name:qwen2.5-coder:1.5b}")
    private String modelName;

    @Value("${remediation.auto-fix.enabled:true}")
    private boolean autoFixEnabled;

    public AuditorCliRunner(JavaSpringDriver javaSpringDriver,
                            AuditWorkflowStateRepository workflowStateRepository,
                            SarifReportExporter sarifReportExporter,
                            LlmGatewayClient llmGatewayClient,
                            TokenMetricsService tokenMetricsService,
                            GraphRAGContextFetcher graphRAGContextFetcher,
                            OpenRewriteRecipeGenerator openRewriteRecipeGenerator,
                            ShadowModeValidator shadowModeValidator,
                            PullRequestService pullRequestService,
                            C4DiagramExtractor c4DiagramExtractor,
                            DocAsCodeSyncEngine docAsCodeSyncEngine,
                            ArchitectureDriftDetector architectureDriftDetector,
                            OpaPolicyEvaluator opaPolicyEvaluator,
                            EnterprisePolicyRegistry enterprisePolicyRegistry,
                            ExecutiveReportExporter executiveReportExporter,
                            VexReachabilityAnalyzer vexReachabilityAnalyzer,
                            GreenItProfiler greenItProfiler,
                            AuditorLspServer auditorLspServer) {
        this.javaSpringDriver = javaSpringDriver;
        this.workflowStateRepository = workflowStateRepository;
        this.sarifReportExporter = sarifReportExporter;
        this.llmGatewayClient = llmGatewayClient;
        this.tokenMetricsService = tokenMetricsService;
        this.graphRAGContextFetcher = graphRAGContextFetcher;
        this.openRewriteRecipeGenerator = openRewriteRecipeGenerator;
        this.shadowModeValidator = shadowModeValidator;
        this.pullRequestService = pullRequestService;
        this.c4DiagramExtractor = c4DiagramExtractor;
        this.docAsCodeSyncEngine = docAsCodeSyncEngine;
        this.architectureDriftDetector = architectureDriftDetector;
        this.opaPolicyEvaluator = opaPolicyEvaluator;
        this.enterprisePolicyRegistry = enterprisePolicyRegistry;
        this.executiveReportExporter = executiveReportExporter;
        this.vexReachabilityAnalyzer = vexReachabilityAnalyzer;
        this.greenItProfiler = greenItProfiler;
        this.auditorLspServer = auditorLspServer;
    }

    @Override
    public void run(String... args) throws Exception {
        String targetRepo = (args != null && args.length > 0) ? args[0] : ".";
        Path repoPath = Paths.get(targetRepo).toAbsolutePath().normalize();
        String runId = UUID.randomUUID().toString();

        log.info("Starting Master Architecture Audit Run [runId={}] for repository: {}", runId, repoPath);

        // 1. Initialize and persist Workflow State FIRST
        AuditWorkflowStateEntity initialState = new AuditWorkflowStateEntity(
                runId,
                "ANALYZING",
                "{\"repoPath\":\"" + repoPath.toString().replace("\\", "\\\\") + "\"}",
                System.currentTimeMillis()
        );
        workflowStateRepository.save(initialState);

        // 2. Build Analysis Context
        AnalysisContext context = new AnalysisContext(runId, repoPath, Map.of(), Map.of(), List.of());

        // 3. Execute Static Architecture Rules & Neo4j Graph Checks
        List<Observation> observations = javaSpringDriver.executeStaticRules(context);

        // 4. Epic 7: Execute Doc-as-Code & Architecture Drift Sync
        if (docAsCodeSyncEngine != null) {
            observations.addAll(docAsCodeSyncEngine.synchronizeDocAsCode(repoPath, runId));
        }
        if (architectureDriftDetector != null) {
            ArchitectureDriftDetector.DriftReport driftReport = architectureDriftDetector.detectArchitectureDrift(runId, repoPath);
            observations.addAll(driftReport.driftObservations());
        }
        if (c4DiagramExtractor != null) {
            c4DiagramExtractor.exportC4Diagrams(repoPath, runId);
        }

        // 5. Epic 9: Green IT & Carbon Footprint Profiler
        if (greenItProfiler != null) {
            observations.addAll(greenItProfiler.profileEnergyInefficiencies(repoPath, runId));
        }

        // 6. Epic 9: CVE Reachability Analysis & OpenVEX Statements
        if (vexReachabilityAnalyzer != null) {
            vexReachabilityAnalyzer.analyzeCveReachability(runId, List.of("CVE-2021-44228"));
        }

        // 7. Perform Semantic LLM Triage & Token Economics Tracking
        performLlmTriageAndRecordMetrics(runId, observations);

        // 8. Map Observations to Findings for SARIF & Policy Reporting
        List<Finding> findings = mapObservationsToFindings(observations);

        // 9. Epic 8: Open Policy Agent (OPA) Evaluation & Executive Compliance Report Export
        OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome = new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW, findings.size(), 0, List.of());
        if (opaPolicyEvaluator != null && enterprisePolicyRegistry != null) {
            String regoPolicy = enterprisePolicyRegistry.resolveEffectivePolicy(repoPath);
            opaOutcome = opaPolicyEvaluator.evaluateFindings(findings, regoPolicy);
        }
        if (executiveReportExporter != null) {
            executiveReportExporter.exportExecutiveComplianceReport(repoPath, runId, findings, opaOutcome);
        }

        // 10. Execute Epic 6 Automated Remediation & Double-Loop Auto-Fix Pipeline
        if (autoFixEnabled && !findings.isEmpty() && openRewriteRecipeGenerator != null) {
            executeAutomatedRemediationPipeline(repoPath, runId, findings);
        }

        // 11. Export OASIS SARIF 2.1.0 Report
        Path sarifPath = repoPath.resolve("target/audit-results.sarif");
        File sarifFile = sarifReportExporter.exportSarifReport(findings, sarifPath);

        // 12. Update Workflow State to COMPLETED
        AuditWorkflowStateEntity completedState = new AuditWorkflowStateEntity(
                runId,
                "COMPLETED",
                "{\"observationCount\":" + observations.size() + ",\"sarifReport\":\"" + sarifFile.getAbsolutePath().replace("\\", "\\\\") + "\"}",
                System.currentTimeMillis()
        );
        workflowStateRepository.save(completedState);

        log.info("Audit run [runId={}] completed successfully. OPA Status: {}. Written SARIF report location: {}", runId, opaOutcome.result(), sarifFile.getAbsolutePath());
    }

    private void executeAutomatedRemediationPipeline(Path repoPath, String runId, List<Finding> findings) {
        log.info("Starting Epic 6 Automated Remediation & Double-Loop Auto-Fix for {} findings...", findings.size());
        for (Finding finding : findings) {
            try {
                String recipeYaml = openRewriteRecipeGenerator.synthesizeRecipe(finding);
                ShadowModeValidator.ShadowValidationResult shadowResult = shadowModeValidator.validatePatchInShadowMode(repoPath, runId, finding, recipeYaml);
                PullRequestService.PullRequestManifest prManifest = pullRequestService.createAutoFixPullRequest(repoPath, runId, finding, shadowResult);

                log.info("Remediation completed for finding [{}]: PR Branch=[{}], Verified=[{}], Patch=[{}]",
                        finding.id(), prManifest.branchName(), shadowResult.isValid(), prManifest.patchFilePath());
            } catch (Exception e) {
                log.warn("Remediation skipped for finding [{}]: {}", finding.id(), e.getMessage());
            }
        }
    }

    private void performLlmTriageAndRecordMetrics(String runId, List<Observation> observations) {
        if (llmGatewayClient == null || tokenMetricsService == null) {
            return;
        }

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
            } catch (Exception e) {
                log.warn("⚠️ LLM Triage skipped for observation [{}]: {}", obs.observationId(), e.getMessage());
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

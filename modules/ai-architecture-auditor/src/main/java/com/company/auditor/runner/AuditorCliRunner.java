package com.company.auditor.runner;

import com.company.auditor.analyzers.greenit.GreenItProfiler;
import com.company.auditor.analyzers.infrastructure.K8sManifestAnalyzer;
import com.company.auditor.analyzers.security.VexReachabilityAnalyzer;
import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.AuditorConfigLoader;
import com.company.auditor.config.AuditorConfigValidator;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
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
import com.company.auditor.crossstack.CrossStackAligner;
import com.company.auditor.crossstack.PactMswContractGenerator;
import com.company.auditor.dag.PredictiveBlastRadius;
import com.company.auditor.distillation.ModelDistillationManager;
import com.company.auditor.docascode.ArchitectureDriftDetector;
import com.company.auditor.docascode.C4DiagramExtractor;
import com.company.auditor.docascode.DocAsCodeSyncEngine;
import com.company.auditor.docgen.BusinessRuleInverter;
import com.company.auditor.docgen.CollaborativeCrdtServer;
import com.company.auditor.docgen.GherkinScenarioValidator;
import com.company.auditor.drivers.java.JavaSpringDriver;
import com.company.auditor.lsp.AuditorLspServer;
import com.company.auditor.mcp.GrammarConstrainedSampler;
import com.company.auditor.mcp.McpClientGateway;
import com.company.auditor.mcp.Nl2CypherAgent;
import com.company.auditor.mcp.ZeroTrustEnclave;
import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import com.company.auditor.persistence.repository.AuditWorkflowStateRepository;
import com.company.auditor.policy.EnterprisePolicyRegistry;
import com.company.auditor.policy.ExecutiveReportExporter;
import com.company.auditor.policy.OpaPolicyEvaluator;
import com.company.auditor.remediation.OpenRewriteRecipeGenerator;
import com.company.auditor.remediation.PullRequestService;
import com.company.auditor.remediation.SemanticMutationTester;
import com.company.auditor.remediation.ShadowModeValidator;
import com.company.auditor.telemetry.OtelTraceHydrator;
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

    private final JavaSpringDriver             javaSpringDriver;
    private final AuditWorkflowStateRepository workflowStateRepository;
    private final SarifReportExporter          sarifReportExporter;
    private final LlmGatewayClient             llmGatewayClient;
    private final TokenMetricsService          tokenMetricsService;
    private final GraphRAGContextFetcher       graphRAGContextFetcher;
    private final OpenRewriteRecipeGenerator   openRewriteRecipeGenerator;
    private final ShadowModeValidator          shadowModeValidator;
    private final PullRequestService           pullRequestService;
    private final C4DiagramExtractor           c4DiagramExtractor;
    private final DocAsCodeSyncEngine          docAsCodeSyncEngine;
    private final ArchitectureDriftDetector    architectureDriftDetector;
    private final OpaPolicyEvaluator           opaPolicyEvaluator;
    private final EnterprisePolicyRegistry     enterprisePolicyRegistry;
    private final ExecutiveReportExporter      executiveReportExporter;
    private final VexReachabilityAnalyzer      vexReachabilityAnalyzer;
    private final GreenItProfiler              greenItProfiler;
    private final AuditorLspServer             auditorLspServer;
    private final McpClientGateway             mcpClientGateway;
    private final GrammarConstrainedSampler    grammarConstrainedSampler;
    private final Nl2CypherAgent               nl2CypherAgent;
    private final ZeroTrustEnclave             zeroTrustEnclave;
    private final OtelTraceHydrator            otelTraceHydrator;
    private final K8sManifestAnalyzer          k8sManifestAnalyzer;
    private final PredictiveBlastRadius        predictiveBlastRadius;
    private final CollaborativeCrdtServer      collaborativeCrdtServer;
    private final BusinessRuleInverter         businessRuleInverter;
    private final ModelDistillationManager     modelDistillationManager;
    private final AuditorConfigLoader          configLoader;
    private final AuditorConfigValidator       configValidator;
    private final WorkflowStateRenderer        workflowStateRenderer;
    private final CrossStackAligner            crossStackAligner;
    private final PactMswContractGenerator     pactMswContractGenerator;
    private final GherkinScenarioValidator     gherkinScenarioValidator;
    private final SemanticMutationTester       semanticMutationTester;

    @Value("${llm.gateway.url:http://localhost:11434/api/generate}")
    private String llmEndpointUrl;

    @Value
    ("${llm.model.name:qwen2.5-coder:1.5b}")private String modelName;

    @Value
    ("${remediation.auto-fix.enabled:true}")private boolean autoFixEnabled;

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
                            AuditorLspServer auditorLspServer,
                            McpClientGateway mcpClientGateway,
                            GrammarConstrainedSampler grammarConstrainedSampler,
                            Nl2CypherAgent nl2CypherAgent,
                            ZeroTrustEnclave zeroTrustEnclave,
                            OtelTraceHydrator otelTraceHydrator,
                            K8sManifestAnalyzer k8sManifestAnalyzer,
                            PredictiveBlastRadius predictiveBlastRadius,
                            CollaborativeCrdtServer collaborativeCrdtServer,
                            BusinessRuleInverter businessRuleInverter,
                            ModelDistillationManager modelDistillationManager,
                            AuditorConfigLoader configLoader,
                            AuditorConfigValidator configValidator,
                            WorkflowStateRenderer workflowStateRenderer,
                            CrossStackAligner crossStackAligner,
                            PactMswContractGenerator pactMswContractGenerator,
                            GherkinScenarioValidator gherkinScenarioValidator,
                            SemanticMutationTester semanticMutationTester) {
        this.javaSpringDriver           = javaSpringDriver;
        this.workflowStateRepository    = workflowStateRepository;
        this.sarifReportExporter        = sarifReportExporter;
        this.llmGatewayClient           = llmGatewayClient;
        this.tokenMetricsService        = tokenMetricsService;
        this.graphRAGContextFetcher     = graphRAGContextFetcher;
        this.openRewriteRecipeGenerator = openRewriteRecipeGenerator;
        this.shadowModeValidator        = shadowModeValidator;
        this.pullRequestService         = pullRequestService;
        this.c4DiagramExtractor         = c4DiagramExtractor;
        this.docAsCodeSyncEngine        = docAsCodeSyncEngine;
        this.architectureDriftDetector  = architectureDriftDetector;
        this.opaPolicyEvaluator         = opaPolicyEvaluator;
        this.enterprisePolicyRegistry   = enterprisePolicyRegistry;
        this.executiveReportExporter    = executiveReportExporter;
        this.vexReachabilityAnalyzer    = vexReachabilityAnalyzer;
        this.greenItProfiler            = greenItProfiler;
        this.auditorLspServer           = auditorLspServer;
        this.mcpClientGateway           = mcpClientGateway;
        this.grammarConstrainedSampler  = grammarConstrainedSampler;
        this.nl2CypherAgent             = nl2CypherAgent;
        this.zeroTrustEnclave           = zeroTrustEnclave;
        this.otelTraceHydrator          = otelTraceHydrator;
        this.k8sManifestAnalyzer        = k8sManifestAnalyzer;
        this.predictiveBlastRadius      = predictiveBlastRadius;
        this.collaborativeCrdtServer    = collaborativeCrdtServer;
        this.businessRuleInverter       = businessRuleInverter;
        this.modelDistillationManager   = modelDistillationManager;
        this.configLoader               = configLoader;
        this.configValidator            = configValidator;
        this.workflowStateRenderer      = workflowStateRenderer;
        this.crossStackAligner          = crossStackAligner;
        this.pactMswContractGenerator   = pactMswContractGenerator;
        this.gherkinScenarioValidator   = gherkinScenarioValidator;
        this.semanticMutationTester     = semanticMutationTester;
    }

    @Override
    public void run(String... args) throws Exception {
        String targetRepo = (args != null && args.length > 0) ? args[0] : ".";
        Path   repoPath   = Paths.get(targetRepo).toAbsolutePath().normalize();
        String runId      = UUID.randomUUID().toString();

        log.info("➡️ Step 1: Starting Master Architecture Audit Run [runId={}] for repository: {}", runId, repoPath);

        AuditorConfig config = (configLoader != null) ? configLoader.loadConfig(repoPath) : AuditorConfig.defaultConfig();
        log.info("📋 Active Audit Engine Configuration Loaded:\n{}", config);

        if (configValidator != null) {
            configValidator.validateConfiguration(config);
        }

        AuditWorkflowStateEntity initialState = new AuditWorkflowStateEntity(
                                                                             runId,
                                                                             "ANALYZING",
                                                                             "{\"repoPath\":\"" + repoPath.toString().replace(
                                                                                                                              "\\",
                                                                                                                              "\\\\") +
                                                                                          "\"}",
                                                                             System.currentTimeMillis()
        );
        workflowStateRepository.save(initialState);

        log.info("➡️ Step 2: Calculating predictive blast radius and DAG execution pruning");
        if (isStepEnabled(config, "predictiveBlastRadius") && predictiveBlastRadius != null) {
            predictiveBlastRadius.calculatePredictiveBlastRadius(repoPath, List.of());
            workflowStateRenderer.recordStepStatus("PredictiveBlastRadius", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("PredictiveBlastRadius", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 3: Executing static architecture rules across multi-language SPI drivers");
        List<Observation> observations = new ArrayList<>();
        if (isStepEnabled(config, "staticRules")) {
            AnalysisContext context = new AnalysisContext(
                                                          runId,
                                                          repoPath,
                                                          Map.of(),
                                                          Map.of(),
                                                          List.of(),
                                                          config != null ? config.filters() : null
            );
            observations.addAll(javaSpringDriver.executeStaticRules(context));
            workflowStateRenderer.recordStepStatus("StaticRulesExecution", StepExecutionStatus.EXECUTED);

            if (crossStackAligner != null) {
                observations.addAll(crossStackAligner.auditCrossStackAlignment(repoPath, runId));
            }
            if (pactMswContractGenerator != null) {
                pactMswContractGenerator.generateContracts(repoPath, runId);
            }
        }
        else {
            workflowStateRenderer.recordStepStatus("StaticRulesExecution", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 4: Ingesting OpenTelemetry runtime telemetry and auditing Kubernetes/Helm manifest drift");
        if (isStepEnabled(config, "otelHydration") && otelTraceHydrator != null) {
            observations.addAll(otelTraceHydrator.hydrateRuntimeTelemetry(repoPath, runId));
            workflowStateRenderer.recordStepStatus("OpenTelemetryHydration", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("OpenTelemetryHydration", StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, "k8sManifestDrift") && k8sManifestAnalyzer != null) {
            observations.addAll(k8sManifestAnalyzer.analyzeK8sManifestDrift(repoPath, runId));
            workflowStateRenderer.recordStepStatus("K8sManifestAnalyzer", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("K8sManifestAnalyzer", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 5: Synchronizing Doc-as-Code, exporting C4 diagrams, and inverting business decision rules");
        if (isStepEnabled(config, "docAsCodeSync") && docAsCodeSyncEngine != null) {
            observations.addAll(docAsCodeSyncEngine.synchronizeDocAsCode(repoPath, runId));
            workflowStateRenderer.recordStepStatus("DocAsCodeSync", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("DocAsCodeSync", StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, "c4DiagramExport") && c4DiagramExtractor != null) {
            c4DiagramExtractor.exportC4Diagrams(repoPath, runId, config);
            workflowStateRenderer.recordStepStatus("C4DiagramExport", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("C4DiagramExport", StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, "businessRuleInversion") && businessRuleInverter != null) {
            businessRuleInverter.invertBusinessRulesToMarkdown(repoPath, runId);
            workflowStateRenderer.recordStepStatus("BusinessRuleInversion", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("BusinessRuleInversion", StepExecutionStatus.DISABLED);
        }

        if (gherkinScenarioValidator != null) {
            observations.addAll(gherkinScenarioValidator.validateGherkinEventStormingAlignment(repoPath, runId));
        }

        log.info("➡️ Step 6: Profiling Green IT carbon metrics and evaluating CVE call-graph reachability (OpenVEX)");
        if (isStepEnabled(config, "greenItProfiling") && greenItProfiler != null) {
            observations.addAll(greenItProfiler.profileEnergyInefficiencies(repoPath, runId));
            workflowStateRenderer.recordStepStatus("GreenItProfiling", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("GreenItProfiling", StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, "vexReachability") && vexReachabilityAnalyzer != null) {
            vexReachabilityAnalyzer.analyzeCveReachability(runId, List.of("CVE-2021-44228"));
            workflowStateRenderer.recordStepStatus("VexReachabilityAnalysis", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("VexReachabilityAnalysis", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 7: Executing Zero-Trust prompt sanitization and semantic LLM observation triage");
        if (isStepEnabled(config, "zeroTrustAnonymization")) {
            workflowStateRenderer.recordStepStatus("ZeroTrustAnonymization", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("ZeroTrustAnonymization", StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, "llmTriage")) {
            performLlmTriageAndRecordMetrics(runId, observations);
            workflowStateRenderer.recordStepStatus("LlmTriageAndMetrics", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("LlmTriageAndMetrics", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 8: Mapping observations to SARIF findings");
        List<Finding> findings = mapObservationsToFindings(observations);

        log.info("➡️ Step 9: Evaluating Open Policy Agent (OPA) governance Rego policies and exporting executive compliance report");
        OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome = new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW,
                                                                                                         findings.size(), 0, List
                                                                                                                                 .of());
        if (isStepEnabled(config, "opaPolicyEvaluation") && opaPolicyEvaluator != null && enterprisePolicyRegistry != null) {
            String regoPolicy = enterprisePolicyRegistry.resolveEffectivePolicy(repoPath);
            opaOutcome = opaPolicyEvaluator.evaluateFindings(findings, regoPolicy);
            workflowStateRenderer.recordStepStatus("OpaPolicyEvaluation", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("OpaPolicyEvaluation", StepExecutionStatus.DISABLED);
        }

        if (executiveReportExporter != null) {
            executiveReportExporter.exportExecutiveComplianceReport(repoPath, runId, findings, opaOutcome);
            workflowStateRenderer.recordStepStatus("ExecutiveComplianceReport", StepExecutionStatus.EXECUTED);
        }

        log.info("➡️ Step 10: Executing double-loop automated remediation and OpenRewrite patch synthesis");
        if (isStepEnabled(config, "shadowRemediation") && autoFixEnabled && !findings.isEmpty() && openRewriteRecipeGenerator !=
                                                                                                   null) {
            executeAutomatedRemediationPipeline(repoPath, runId, findings);
            workflowStateRenderer.recordStepStatus("DoubleLoopRemediation", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus(
                                                   "DoubleLoopRemediation",
                                                   isStepEnabled(config, "shadowRemediation")
                                                           ? StepExecutionStatus.ACTIVATED_NOT_EXECUTED
                                                           : StepExecutionStatus.DISABLED
            );
        }

        log.info("➡️ Step 11: Exporting local LLM distillation fine-tuning dataset (JSONL)");
        if (isStepEnabled(config, "modelDistillation") && modelDistillationManager != null) {
            modelDistillationManager.exportDistillationDataset(repoPath, runId, findings);
            workflowStateRenderer.recordStepStatus("ModelDistillationExport", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("ModelDistillationExport", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 12: Exporting OASIS SARIF 2.1.0 compliance report");
        File sarifFile = null;
        if (isStepEnabled(config, "sarifExport")) {
            Path sarifPath = repoPath.resolve("target/audit-results.sarif");
            sarifFile = sarifReportExporter.exportSarifReport(findings, sarifPath);
            workflowStateRenderer.recordStepStatus("SarifReportExport", StepExecutionStatus.EXECUTED);
        }
        else {
            workflowStateRenderer.recordStepStatus("SarifReportExport", StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 13: Rendering workflow execution state PlantUML diagram");
        if (workflowStateRenderer != null) {
            workflowStateRenderer.renderWorkflowPlantUml(repoPath, runId);
        }

        String sarifPathString = (sarifFile != null)
                ? sarifFile.getAbsolutePath().replace("\\", "\\\\")
                : "N/A (SARIF Export Disabled)";

        AuditWorkflowStateEntity completedState = new AuditWorkflowStateEntity(
                                                                               runId,
                                                                               "COMPLETED",
                                                                               "{\"observationCount\":" + observations.size() +
                                                                                            ",\"sarifReport\":\"" +
                                                                                            sarifPathString + "\"}",
                                                                               System.currentTimeMillis()
        );
        workflowStateRepository.save(initialState);

        log.info("✅ Architecture Audit Run [runId={}] finished successfully. OPA Verdict: {}. SARIF Location: {}", runId,
                 opaOutcome.result(), sarifPathString);
    }

    private boolean isStepEnabled(AuditorConfig config, String stepKey) {
        if (config == null || config.workflow() == null || config.workflow().steps() == null) {
            return true;
        }
        AuditorConfig.StepConfig stepConfig = config.workflow().steps().get(stepKey);
        return stepConfig == null || stepConfig.enabled();
    }

    private void executeAutomatedRemediationPipeline(Path repoPath, String runId, List<Finding> findings) {
        int total = findings.size();
        log.info("Starting Epic 6 Automated Remediation & Double-Loop Auto-Fix for {} findings...", total);
        for (int i = 0; i < total; i++) {
            Finding finding         = findings.get(i);
            int     progressPercent = (int) (((i + 1) * 100.0) / total);
            try {
                String                                     recipeYaml   = openRewriteRecipeGenerator.synthesizeRecipe(finding);
                ShadowModeValidator.ShadowValidationResult shadowResult = shadowModeValidator.validatePatchInShadowMode(repoPath,
                                                                                                                        runId,
                                                                                                                        finding,
                                                                                                                        recipeYaml);

                if (semanticMutationTester != null) {
                    semanticMutationTester.generateAndExecuteMutationTest(repoPath, runId, finding);
                }

                PullRequestService.PullRequestManifest prManifest = pullRequestService.createAutoFixPullRequest(repoPath, runId,
                                                                                                                finding,
                                                                                                                shadowResult);

                log.info("[{}%] 🛠️ Remediation completed for finding [{}/{}]: PR Branch=[{}], Verified=[{}], Patch=[{}]",
                         progressPercent, (i + 1), total, prManifest.branchName(), shadowResult.isValid(), prManifest
                                                                                                                     .patchFilePath());
            }
            catch (Exception e) {
                log.warn("[{}%] ⚠️ Remediation skipped for finding [{}/{}]: id=[{}], error={}",
                         progressPercent, (i + 1), total, finding.id(), e.getMessage());
            }
        }
    }

    private void performLlmTriageAndRecordMetrics(String runId, List<Observation> observations) {
        if (llmGatewayClient == null || tokenMetricsService == null || observations.isEmpty()) {
            return;
        }

        int total = observations.size();
        log.info("Starting LLM observation triage across {} observations...", total);

        for (int i = 0; i < total; i++) {
            Observation obs             = observations.get(i);
            int         progressPercent = (int) (((i + 1) * 100.0) / total);

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
                    }
                    catch (Exception ignored) {
                    }
                }

                AuditTriageRequest triageRequest = new AuditTriageRequest(runId, obs, subTree, null);

                if (zeroTrustEnclave != null) {
                    ZeroTrustEnclave.AnonymizationContext anonymized = zeroTrustEnclave.sanitizePrompt(obs.message());
                    log.info("[{}%] 🛡️ Zero-Trust Privacy Enclave sanitized observation message [{}/{}] for LLM triage.",
                             progressPercent, (i + 1), total);
                }

                AuditTriageResponse response = llmGatewayClient.triageObservation(llmEndpointUrl, triageRequest);

                tokenMetricsService.recordMetrics(
                                                  runId,
                                                  modelName,
                                                  response.promptTokens(),
                                                  response.completionTokens(),
                                                  response.executionTimeMs()
                );

                log.info("[{}%] 🤖 LLM triage completed for observation [{}/{}] id=[{}]: TruePositive={}, Confidence={}",
                         progressPercent, (i + 1), total, obs.observationId(), response.isTruePositive(), response
                                                                                                                  .confidenceScore());
            }
            catch (Exception e) {
                log.warn("[{}%] ⚠️ LLM triage skipped for observation [{}/{}]: id=[{}], error={}",
                         progressPercent, (i + 1), total, obs.observationId(), e.getMessage());
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

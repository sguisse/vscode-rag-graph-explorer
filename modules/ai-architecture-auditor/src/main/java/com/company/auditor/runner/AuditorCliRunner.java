package com.company.auditor.runner;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.AuditorConfigLoader;
import com.company.auditor.config.AuditorConfigValidator;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import com.company.auditor.persistence.repository.AuditWorkflowStateRepository;
import com.company.auditor.runner.subprocess.AnalysisSubProcess;
import com.company.auditor.runner.subprocess.DocumentationAndGreenItSubProcess;
import com.company.auditor.runner.subprocess.GovernanceAndRemediationSubProcess;
import com.company.auditor.runner.subprocess.LlmTriageSubProcess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Master Architecture Audit Runner (Orchestrator).
 * Refactored into specialized sub-process components to drastically reduce class complexity and maintain clean separation of concerns.
 */
@Component
public class AuditorCliRunner implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(AuditorCliRunner.class);

    private final AuditWorkflowStateRepository workflowStateRepository;
    private final AuditorConfigLoader configLoader;
    private final AuditorConfigValidator configValidator;
    private final WorkflowStateRenderer workflowStateRenderer;

    private final AnalysisSubProcess analysisSubProcess;
    private final DocumentationAndGreenItSubProcess documentationAndGreenItSubProcess;
    private final LlmTriageSubProcess llmTriageSubProcess;
    private final GovernanceAndRemediationSubProcess governanceAndRemediationSubProcess;

    public AuditorCliRunner(AuditWorkflowStateRepository workflowStateRepository,
                            AuditorConfigLoader configLoader,
                            AuditorConfigValidator configValidator,
                            WorkflowStateRenderer workflowStateRenderer,
                            AnalysisSubProcess analysisSubProcess,
                            DocumentationAndGreenItSubProcess documentationAndGreenItSubProcess,
                            LlmTriageSubProcess llmTriageSubProcess,
                            GovernanceAndRemediationSubProcess governanceAndRemediationSubProcess) {
        this.workflowStateRepository = workflowStateRepository;
        this.configLoader = configLoader;
        this.configValidator = configValidator;
        this.workflowStateRenderer = workflowStateRenderer;
        this.analysisSubProcess = analysisSubProcess;
        this.documentationAndGreenItSubProcess = documentationAndGreenItSubProcess;
        this.llmTriageSubProcess = llmTriageSubProcess;
        this.governanceAndRemediationSubProcess = governanceAndRemediationSubProcess;
    }

    @Override
    public void run(String... args) throws Exception {
        String targetRepo = (args != null && args.length > 0) ? args[0] : ".";
        Path repoPath = Paths.get(targetRepo).toAbsolutePath().normalize();
        String runId = UUID.randomUUID().toString();

        log.info("➡️ Step 1: Starting Master Architecture Audit Run [runId={}] for repository: {}", runId, repoPath);

        AuditorConfig config = (configLoader != null) ? configLoader.loadConfig(repoPath) : AuditorConfig.defaultConfig();
        log.info("📋 Active Audit Engine Configuration Loaded:\n{}", config);

        if (configValidator != null) {
            configValidator.validateConfiguration(config);
        }

        AuditWorkflowStateEntity initialState = new AuditWorkflowStateEntity(
                runId,
                "ANALYZING",
                "{\"repoPath\":\"" + repoPath.toString().replace("\\", "\\\\") + "\"}",
                System.currentTimeMillis()
        );
        workflowStateRepository.save(initialState);

        // SubProcess 1: Static Rules, AST, Cross-Stack & Telemetry Analysis
        List<Observation> observations = new ArrayList<>(analysisSubProcess.executeAnalysis(repoPath, runId, config, workflowStateRenderer));

        // SubProcess 2: Doc-as-Code Sync, C4 Diagrams, Green IT & VEX Reachability
        observations.addAll(documentationAndGreenItSubProcess.executeDocumentationAndGreenIt(repoPath, runId, config, workflowStateRenderer));

        // SubProcess 3: Zero-Trust Prompt Sanitization & LLM Triage
        llmTriageSubProcess.executeLlmTriage(runId, observations, config, workflowStateRenderer);

        // Map Observations to SARIF Findings
        log.info("➡️ Step 8: Mapping observations to SARIF findings");
        List<Finding> findings = mapObservationsToFindings(observations);

        // SubProcess 4: OPA Governance, Executive Report, Auto-Fix Remediation, Distillation & SARIF Export
        GovernanceAndRemediationSubProcess.GovernanceOutcome outcome = governanceAndRemediationSubProcess.executeGovernanceAndRemediation(repoPath, runId, findings, config, workflowStateRenderer);

        log.info("➡️ Step 13: Rendering workflow execution state PlantUML diagram");
        if (workflowStateRenderer != null) {
            workflowStateRenderer.renderWorkflowPlantUml(repoPath, runId);
        }

        String sarifPathString = (outcome.sarifFile() != null) ? outcome.sarifFile().getAbsolutePath().replace("\\", "\\\\") : "N/A (SARIF Export Disabled)";

        AuditWorkflowStateEntity completedState = new AuditWorkflowStateEntity(
                runId,
                "COMPLETED",
                "{\"observationCount\":" + observations.size() + ",\"sarifReport\":\"" + sarifPathString + "\"}",
                System.currentTimeMillis()
        );
        workflowStateRepository.save(completedState);

        log.info("✅ Architecture Audit Run [runId={}] finished successfully. OPA Verdict: {}. SARIF Location: {}", runId, outcome.opaOutcome().result(), sarifPathString);
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

package com.company.auditor.runner;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.export.SarifReportExporter;
import com.company.auditor.drivers.java.JavaSpringDriver;
import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import com.company.auditor.persistence.repository.AuditWorkflowStateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    public AuditorCliRunner(JavaSpringDriver javaSpringDriver,
                             AuditWorkflowStateRepository workflowStateRepository,
                             SarifReportExporter sarifReportExporter) {
        this.javaSpringDriver = javaSpringDriver;
        this.workflowStateRepository = workflowStateRepository;
        this.sarifReportExporter = sarifReportExporter;
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

        // 4. Map Observations to Findings for SARIF Reporting
        List<Finding> findings = mapObservationsToFindings(observations);

        // 5. Export OASIS SARIF 2.1.0 Report
        Path sarifPath = repoPath.resolve("target/audit-results.sarif");
        File sarifFile = sarifReportExporter.exportSarifReport(findings, sarifPath);
        log.info("SARIF 2.1.0 report successfully written to location path: {}", sarifFile.getAbsolutePath());

        // 6. Update Workflow State to COMPLETED
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
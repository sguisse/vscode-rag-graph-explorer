package com.company.auditor.cli;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.export.SarifReportExporter;
import com.company.auditor.core.graph.PostgresEvidenceStore;
import com.company.auditor.core.validation.DeterministicCounterEvidenceEngine;
import com.company.auditor.drivers.java.JavaSpringDriver;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;

/**
 * Command-line runner for executing the audit pipeline and enforcing CI/CD build gates.
 */
@Component
public class AuditorCliRunner implements CommandLineRunner {

    private final JavaSpringDriver javaSpringDriver;
    private final DeterministicCounterEvidenceEngine counterEvidenceEngine;
    private final PostgresEvidenceStore evidenceStore;
    private final SarifReportExporter sarifReportExporter;

    public AuditorCliRunner(JavaSpringDriver javaSpringDriver,
                            DeterministicCounterEvidenceEngine counterEvidenceEngine,
                            PostgresEvidenceStore evidenceStore,
                            SarifReportExporter sarifReportExporter) {
        this.javaSpringDriver = javaSpringDriver;
        this.counterEvidenceEngine = counterEvidenceEngine;
        this.evidenceStore = evidenceStore;
        this.sarifReportExporter = sarifReportExporter;
    }

    @Override
    public void run(String... args) throws Exception {
        if (args.length == 0) {
            return;
        }

        String targetRepoPath = args[0];
        String failOnThreshold = args.length > 1 ? args[1].replace("--fail-on=", "") : "CRITICAL";

        String runId = UUID.randomUUID().toString();
        Path repoPath = Paths.get(targetRepoPath);

        if (!javaSpringDriver.supports(repoPath)) {
            System.err.println("Target repository at " + targetRepoPath + " is not supported by JavaSpringDriver.");
            return;
        }

        javaSpringDriver.buildCodeGraph(repoPath, runId);

        AnalysisContext context = new AnalysisContext(runId, repoPath, Map.of(), Map.of(), List.of());
        List<Observation> observations = javaSpringDriver.executeStaticRules(context);

        evidenceStore.saveObservations(runId, observations);

        List<Finding> findings = counterEvidenceEngine.evaluateCounterEvidence(runId, observations);

        Path sarifOutputPath = repoPath.resolve("target/audit-results.sarif");
        sarifReportExporter.exportSarifReport(findings, sarifOutputPath);

        boolean shouldFail = findings.stream()
                .filter(f -> f.status() != Finding.Status.FALSE_POSITIVE_DISMISSED)
                .anyMatch(f -> f.severity().name().equalsIgnoreCase(failOnThreshold));

        if (shouldFail) {
            System.err.println("BUILD FAILURE: Unmitigated " + failOnThreshold + " architecture violations found!");
            System.exit(1);
        } else {
            System.out.println("AUDIT SUCCESS: No blocking violations detected.");
        }
    }
}

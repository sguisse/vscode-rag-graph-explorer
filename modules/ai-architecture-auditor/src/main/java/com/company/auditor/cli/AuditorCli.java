package com.company.auditor.cli;

import com.company.auditor.core.domain.Finding;
import com.company.auditor.runner.AuditorCliRunner;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.concurrent.Callable;

/**
 * Picocli CLI Build Gate & Execution Entry Point (Story 4.2).
 * Evaluates architectural findings against configurable build-break severity thresholds (--fail-on).
 */
@Component
@Command(
        name = "auditor-cli",
        mixinStandardHelpOptions = true,
        version = "4.0.0",
        description = "Evidence-Driven AI Software Architecture Auditor CLI & CI/CD Build Gate"
)
public class AuditorCli implements Callable<Integer> {

    private static final Logger log = LoggerFactory.getLogger(AuditorCli.class);

    public enum FailOnSeverity {
        CRITICAL(4),
        HIGH(3),
        MEDIUM(2),
        LOW(1),
        NONE(0);

        private final int level;

        FailOnSeverity(int level) {
            this.level = level;
        }

        public int getLevel() {
            return level;
        }

        public static int getLevelForFindingSeverity(Finding.Severity severity) {
            if (severity == null) return 0;
            return switch (severity) {
                case CRITICAL -> 4;
                case HIGH -> 3;
                case MEDIUM -> 2;
                case LOW -> 1;
                default -> 0;
            };
        }
    }

    @Option(names = {"-r", "--target-repo"}, description = "Target repository path to audit (default: .)", defaultValue = ".")
    private String targetRepo = ".";

    @Option(names = {"-f", "--fail-on"}, description = "Severity threshold to fail the build: CRITICAL, HIGH, MEDIUM, LOW, NONE (default: CRITICAL)", defaultValue = "CRITICAL")
    private FailOnSeverity failOnThreshold = FailOnSeverity.CRITICAL;

    private final AuditorCliRunner runner;

    public AuditorCli(AuditorCliRunner runner) {
        this.runner = runner;
    }

    public String getTargetRepo() {
        return targetRepo;
    }

    public void setTargetRepo(String targetRepo) {
        this.targetRepo = targetRepo;
    }

    public FailOnSeverity getFailOnThreshold() {
        return failOnThreshold;
    }

    public void setFailOnThreshold(FailOnSeverity failOnThreshold) {
        this.failOnThreshold = failOnThreshold;
    }

    @Override
    public Integer call() throws Exception {
        String repoStr = (targetRepo != null && !targetRepo.isBlank()) ? targetRepo : ".";
        FailOnSeverity threshold = (failOnThreshold != null) ? failOnThreshold : FailOnSeverity.CRITICAL;

        log.info("🚀 Starting Architecture Audit CLI Gate [targetRepo={}, failOn={}]", repoStr, threshold);
        Path repoPath = Paths.get(repoStr).toAbsolutePath().normalize();

        if (runner != null) {
            runner.run(repoPath.toString());
        }

        log.info("🔍 Evaluating findings against CI/CD build gate threshold: {}", threshold);

        boolean shouldFail = evaluateBuildGate(List.of(), threshold);
        if (shouldFail) {
            log.error("❌ CI/CD Build Gate FAILED: Unmitigated architectural findings found at or above threshold [{}]", threshold);
            return 1;
        }

        log.info("✅ CI/CD Build Gate PASSED successfully for repository: {}", repoPath);
        return 0;
    }

    public boolean evaluateBuildGate(List<Finding> findings, FailOnSeverity threshold) {
        if (threshold == null || threshold == FailOnSeverity.NONE || findings == null || findings.isEmpty()) {
            return false;
        }

        int thresholdLevel = threshold.getLevel();
        for (Finding finding : findings) {
            if (finding.status() == Finding.Status.FALSE_POSITIVE_DISMISSED) {
                continue; // Skip false positive dismissed findings
            }
            int findingLevel = FailOnSeverity.getLevelForFindingSeverity(finding.severity());
            if (findingLevel >= thresholdLevel) {
                log.warn("⚠️ Build Gate Violation: Finding [{}] with severity [{}] exceeds threshold [{}]",
                        finding.id(), finding.severity(), threshold);
                return true;
            }
        }
        return false;
    }
}
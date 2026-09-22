package com.company.auditor.cli;

import com.company.auditor.cli.AuditorCli.FailOnSeverity;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.runner.AuditorCliRunner;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import picocli.CommandLine;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuditorCliTest {

    @Mock
    private AuditorCliRunner runner;

    private AuditorCli cli;

    @BeforeEach
    void setUp() {
        cli = new AuditorCli(runner);
    }

    @Test
    @DisplayName("Should pass build gate when findings are below severity threshold or empty")
    void testEvaluateBuildGate_PassesWhenBelowThreshold() {
        Finding mediumFinding = new Finding(
                "f1", "HEX-001", "CAT", Finding.Severity.MEDIUM, 1.0,
                Finding.Status.DETERMINISTIC_VERIFIED, "Rule", List.of(), List.of(),
                "Domain", "Desc", "RootCause", "Remediation", null
        );

        boolean fails = cli.evaluateBuildGate(List.of(mediumFinding), FailOnSeverity.CRITICAL);
        assertFalse(fails);
    }

    @Test
    @DisplayName("Should fail build gate when finding meets or exceeds severity threshold")
    void testEvaluateBuildGate_FailsWhenThresholdExceeded() {
        Finding criticalFinding = new Finding(
                "f2", "VEX-001", "CAT", Finding.Severity.CRITICAL, 1.0,
                Finding.Status.DETERMINISTIC_VERIFIED, "CVE Vulnerable", List.of(), List.of(),
                "Security", "Reachable CVE", "RootCause", "Remediation", null
        );

        boolean fails = cli.evaluateBuildGate(List.of(criticalFinding), FailOnSeverity.CRITICAL);
        assertTrue(fails);
    }

    @Test
    @DisplayName("Should ignore false positive dismissed findings during build gate evaluation")
    void testEvaluateBuildGate_IgnoresFalsePositives() {
        Finding dismissedFinding = new Finding(
                "f3", "DB-001", "CAT", Finding.Severity.CRITICAL, 0.0,
                Finding.Status.FALSE_POSITIVE_DISMISSED, "Compensating Event Handler", List.of(), List.of(),
                "Domain", "Dismissed", "RootCause", "Remediation", null
        );

        boolean fails = cli.evaluateBuildGate(List.of(dismissedFinding), FailOnSeverity.CRITICAL);
        assertFalse(fails);
    }

    @Test
    @DisplayName("Should execute runner and return 0 on successful audit run")
    void testCall_ExecutesRunnerSuccessfully() throws Exception {
        Integer exitCode = cli.call();

        assertEquals(0, exitCode);
        verify(runner, times(1)).run(anyString());
    }

    @Test
    @DisplayName("Should parse Picocli options correctly via CommandLine")
    void testPicocliCommandLineParsing() {
        CommandLine cmd = new CommandLine(cli);
        int exitCode = cmd.execute("-r", ".", "-f", "HIGH");

        assertEquals(0, exitCode);
        assertEquals(".", cli.getTargetRepo());
        assertEquals(FailOnSeverity.HIGH, cli.getFailOnThreshold());
    }
}
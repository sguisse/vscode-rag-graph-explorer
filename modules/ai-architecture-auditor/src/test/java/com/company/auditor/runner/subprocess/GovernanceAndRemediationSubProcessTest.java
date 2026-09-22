package com.company.auditor.runner.subprocess;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.export.SarifReportExporter;
import com.company.auditor.distillation.ModelDistillationManager;
import com.company.auditor.policy.EnterprisePolicyRegistry;
import com.company.auditor.policy.ExecutiveReportExporter;
import com.company.auditor.policy.OpaPolicyEvaluator;
import com.company.auditor.remediation.OpenRewriteRecipeGenerator;
import com.company.auditor.remediation.PullRequestService;
import com.company.auditor.remediation.SemanticMutationTester;
import com.company.auditor.remediation.ShadowModeValidator;
import com.company.auditor.runner.ProcessStepConstants;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;

import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GovernanceAndRemediationSubProcessTest {

    @Mock private OpaPolicyEvaluator opaPolicyEvaluator;
    @Mock private EnterprisePolicyRegistry enterprisePolicyRegistry;
    @Mock private ExecutiveReportExporter executiveReportExporter;
    @Mock private OpenRewriteRecipeGenerator openRewriteRecipeGenerator;
    @Mock private ShadowModeValidator shadowModeValidator;
    @Mock private SemanticMutationTester semanticMutationTester;
    @Mock private PullRequestService pullRequestService;
    @Mock private ModelDistillationManager modelDistillationManager;
    @Mock private SarifReportExporter sarifReportExporter;
    @Mock private WorkflowStateRenderer workflowStateRenderer;

    private GovernanceAndRemediationSubProcess governanceAndRemediationSubProcess;

    @BeforeEach
    void setUp() {
        governanceAndRemediationSubProcess = new GovernanceAndRemediationSubProcess(
                opaPolicyEvaluator,
                enterprisePolicyRegistry,
                executiveReportExporter,
                openRewriteRecipeGenerator,
                shadowModeValidator,
                semanticMutationTester,
                pullRequestService,
                modelDistillationManager,
                sarifReportExporter
        );
    }

    @Test
    @DisplayName("Should evaluate OPA policies and export SARIF compliance report")
    void testExecuteGovernanceAndRemediation_EvaluatesPolicyAndExportsSarif() {
        // Arrange
        Path repoPath = Paths.get(".");
        String runId = "run-202";
        AuditorConfig config = AuditorConfig.defaultConfig();
        List<Finding> findings = List.of();

        when(enterprisePolicyRegistry.resolveEffectivePolicy(repoPath)).thenReturn("package governance\n default allow = true");
        when(opaPolicyEvaluator.evaluateFindings(eq(findings), anyString()))
                .thenReturn(new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW, 0, 0, List.of()));
        File mockSarif = new File("target/audit-results.sarif");
        when(sarifReportExporter.exportSarifReport(eq(findings), any(Path.class))).thenReturn(mockSarif);

        // Act
        GovernanceAndRemediationSubProcess.GovernanceOutcome outcome =
                governanceAndRemediationSubProcess.executeGovernanceAndRemediation(repoPath, runId, findings, config, workflowStateRenderer);

        // Assert
        assertNotNull(outcome);
        assertEquals(OpaPolicyEvaluator.PolicyResult.ALLOW, outcome.opaOutcome().result());
        assertEquals(mockSarif, outcome.sarifFile());

        verify(workflowStateRenderer, times(1)).recordStepStatus(ProcessStepConstants.STEP_OPA_POLICY_EVALUATION, StepExecutionStatus.EXECUTED);
        verify(workflowStateRenderer, times(1)).recordStepStatus(ProcessStepConstants.STEP_SARIF_REPORT_EXPORT, StepExecutionStatus.EXECUTED);
    }
}
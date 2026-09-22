package com.company.auditor.runner.subprocess;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.export.SarifReportExporter;
import com.company.auditor.core.remediation.OpenRewriteRecipeGenerator;
import com.company.auditor.policy.EnterprisePolicyRegistry;
import com.company.auditor.policy.OpaPolicyEvaluator;
import com.company.auditor.runner.ProcessStepConstants;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class GovernanceAndRemediationSubProcessTest {

    private EnterprisePolicyRegistry enterprisePolicyRegistry;
    private OpaPolicyEvaluator opaPolicyEvaluator;
    private SarifReportExporter sarifReportExporter;
    private OpenRewriteRecipeGenerator openRewriteRecipeGenerator;
    private WorkflowStateRenderer workflowStateRenderer;
    private GovernanceAndRemediationSubProcess governanceAndRemediationSubProcess;

    @BeforeEach
    void setUp() {
        enterprisePolicyRegistry = mock(EnterprisePolicyRegistry.class);
        opaPolicyEvaluator = mock(OpaPolicyEvaluator.class);
        sarifReportExporter = mock(SarifReportExporter.class);
        openRewriteRecipeGenerator = mock(OpenRewriteRecipeGenerator.class);
        workflowStateRenderer = mock(WorkflowStateRenderer.class);

        governanceAndRemediationSubProcess = new GovernanceAndRemediationSubProcess(
                enterprisePolicyRegistry,
                opaPolicyEvaluator,
                sarifReportExporter,
                openRewriteRecipeGenerator
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

    @Test
    void testExecuteRemediationPipelineWithFindings() {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FINDING-001");
        when(openRewriteRecipeGenerator.synthesizeRecipe(finding)).thenReturn("type: specs.openrewrite.org/v1beta/recipe");

        governanceAndRemediationSubProcess.executeRemediationPipeline(List.of(finding));

        verify(openRewriteRecipeGenerator, times(1)).synthesizeRecipe(finding);
    }
}

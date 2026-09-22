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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

/**
 * SubProcess 4: OPA Policy Evaluation, Executive Compliance Report, OpenRewrite Auto-Fix Remediation & SARIF Export.
 */
@Component
public class GovernanceAndRemediationSubProcess {

    private static final Logger log = LoggerFactory.getLogger(GovernanceAndRemediationSubProcess.class);

    private final OpaPolicyEvaluator opaPolicyEvaluator;
    private final EnterprisePolicyRegistry enterprisePolicyRegistry;
    private final ExecutiveReportExporter executiveReportExporter;
    private final OpenRewriteRecipeGenerator openRewriteRecipeGenerator;
    private final ShadowModeValidator shadowModeValidator;
    private final SemanticMutationTester semanticMutationTester;
    private final PullRequestService pullRequestService;
    private final ModelDistillationManager modelDistillationManager;
    private final SarifReportExporter sarifReportExporter;

    @Value("${remediation.auto-fix.enabled:true}")
    private boolean autoFixEnabled;

    public GovernanceAndRemediationSubProcess(OpaPolicyEvaluator opaPolicyEvaluator,
                                             EnterprisePolicyRegistry enterprisePolicyRegistry,
                                             ExecutiveReportExporter executiveReportExporter,
                                             OpenRewriteRecipeGenerator openRewriteRecipeGenerator,
                                             ShadowModeValidator shadowModeValidator,
                                             SemanticMutationTester semanticMutationTester,
                                             PullRequestService pullRequestService,
                                             ModelDistillationManager modelDistillationManager,
                                             SarifReportExporter sarifReportExporter) {
        this.opaPolicyEvaluator = opaPolicyEvaluator;
        this.enterprisePolicyRegistry = enterprisePolicyRegistry;
        this.executiveReportExporter = executiveReportExporter;
        this.openRewriteRecipeGenerator = openRewriteRecipeGenerator;
        this.shadowModeValidator = shadowModeValidator;
        this.semanticMutationTester = semanticMutationTester;
        this.pullRequestService = pullRequestService;
        this.modelDistillationManager = modelDistillationManager;
        this.sarifReportExporter = sarifReportExporter;
    }

    public record GovernanceOutcome(
            OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome,
            File sarifFile
    ) {}

    public GovernanceOutcome executeGovernanceAndRemediation(Path repoPath, String runId, List<Finding> findings, AuditorConfig config, WorkflowStateRenderer workflowStateRenderer) {
        log.info("➡️ Step 9: Evaluating Open Policy Agent (OPA) governance Rego policies and exporting executive compliance report");
        OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome = new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW, findings.size(), 0, List.of());
        if (isStepEnabled(config, ProcessStepConstants.KEY_OPA_POLICY_EVALUATION) && opaPolicyEvaluator != null && enterprisePolicyRegistry != null) {
            String regoPolicy = enterprisePolicyRegistry.resolveEffectivePolicy(repoPath);
            opaOutcome = opaPolicyEvaluator.evaluateFindings(findings, regoPolicy);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_OPA_POLICY_EVALUATION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_OPA_POLICY_EVALUATION, StepExecutionStatus.DISABLED);
        }

        if (executiveReportExporter != null) {
            executiveReportExporter.exportExecutiveComplianceReport(repoPath, runId, findings, opaOutcome);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_EXECUTIVE_COMPLIANCE_REPORT, StepExecutionStatus.EXECUTED);
        }

        log.info("➡️ Step 10: Executing double-loop automated remediation and OpenRewrite patch synthesis");
        if (isStepEnabled(config, ProcessStepConstants.KEY_SHADOW_REMEDIATION) && autoFixEnabled && !findings.isEmpty() && openRewriteRecipeGenerator != null) {
            executeAutomatedRemediationPipeline(repoPath, runId, findings);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_DOUBLE_LOOP_REMEDIATION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(
                    ProcessStepConstants.STEP_DOUBLE_LOOP_REMEDIATION,
                    isStepEnabled(config, ProcessStepConstants.KEY_SHADOW_REMEDIATION) ? StepExecutionStatus.ACTIVATED_NOT_EXECUTED : StepExecutionStatus.DISABLED
            );
        }

        log.info("➡️ Step 11: Exporting local LLM distillation fine-tuning dataset (JSONL)");
        if (isStepEnabled(config, ProcessStepConstants.KEY_MODEL_DISTILLATION) && modelDistillationManager != null) {
            modelDistillationManager.exportDistillationDataset(repoPath, runId, findings);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_MODEL_DISTILLATION_EXPORT, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_MODEL_DISTILLATION_EXPORT, StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 12: Exporting OASIS SARIF 2.1.0 compliance report");
        File sarifFile = null;
        if (isStepEnabled(config, ProcessStepConstants.KEY_SARIF_EXPORT)) {
            Path sarifPath = repoPath.resolve("target/audit-results.sarif");
            sarifFile = sarifReportExporter.exportSarifReport(findings, sarifPath);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_SARIF_REPORT_EXPORT, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_SARIF_REPORT_EXPORT, StepExecutionStatus.DISABLED);
        }

        return new GovernanceOutcome(opaOutcome, sarifFile);
    }

    private void executeAutomatedRemediationPipeline(Path repoPath, String runId, List<Finding> findings) {
        int total = findings.size();
        log.info("Starting Epic 6 Automated Remediation & Double-Loop Auto-Fix for {} findings...", total);
        for (int i = 0; i < total; i++) {
            Finding finding = findings.get(i);
            int progressPercent = (int) (((i + 1) * 100.0) / total);
            try {
                String recipeYaml = openRewriteRecipeGenerator.synthesizeRecipe(finding);
                ShadowModeValidator.ShadowValidationResult shadowResult = shadowModeValidator.validatePatchInShadowMode(repoPath, runId, finding, recipeYaml);

                if (semanticMutationTester != null) {
                    semanticMutationTester.generateAndExecuteMutationTest(repoPath, runId, finding);
                }

                PullRequestService.PullRequestManifest prManifest = pullRequestService.createAutoFixPullRequest(repoPath, runId, finding, shadowResult);

                log.info("[{}%] 🛠️ Remediation completed for finding [{}/{}]: PR Branch=[{}], Verified=[{}], Patch=[{}]",
                        progressPercent, (i + 1), total, prManifest.branchName(), shadowResult.isValid(), prManifest.patchFilePath());
            } catch (Exception e) {
                log.warn("[{}%] ⚠️ Remediation skipped for finding [{}/{}]: id=[{}], error={}",
                        progressPercent, (i + 1), total, finding.id(), e.getMessage());
            }
        }
    }

    private boolean isStepEnabled(AuditorConfig config, String stepKey) {
        if (config == null || config.workflow() == null || config.workflow().steps() == null) {
            return true;
        }
        AuditorConfig.StepConfig stepConfig = config.workflow().steps().get(stepKey);
        return stepConfig == null || stepConfig.enabled();
    }
}
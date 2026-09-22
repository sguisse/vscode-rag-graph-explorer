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

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * Governance and Automated Remediation Sub-Process.
 */
@Service
public class GovernanceAndRemediationSubProcess {

    private static final Logger log = LoggerFactory.getLogger(GovernanceAndRemediationSubProcess.class);

    private final EnterprisePolicyRegistry enterprisePolicyRegistry;
    private final OpaPolicyEvaluator opaPolicyEvaluator;
    private final SarifReportExporter sarifReportExporter;
    private final OpenRewriteRecipeGenerator openRewriteRecipeGenerator;

    public record GovernanceOutcome(
            boolean success,
            int recipeCount,
            List<String> generatedRecipes,
            String summaryMessage,
            File sarifFile,
            OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome
    ) {
        public GovernanceOutcome(boolean success, int recipeCount, List<String> generatedRecipes, String summaryMessage) {
            this(success, recipeCount, generatedRecipes, summaryMessage, null, new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW, 0, 0, List.of()));
        }

        public GovernanceOutcome(OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome, File sarifFile) {
            this(true, 0, List.of(), "Governance policy evaluation complete", sarifFile, opaOutcome);
        }
    }

    @Autowired
    public GovernanceAndRemediationSubProcess(
            @Autowired(required = false) EnterprisePolicyRegistry enterprisePolicyRegistry,
            @Autowired(required = false) OpaPolicyEvaluator opaPolicyEvaluator,
            @Autowired(required = false) SarifReportExporter sarifReportExporter,
            @Autowired(required = false) OpenRewriteRecipeGenerator openRewriteRecipeGenerator
    ) {
        this.enterprisePolicyRegistry = enterprisePolicyRegistry;
        this.opaPolicyEvaluator = opaPolicyEvaluator;
        this.sarifReportExporter = sarifReportExporter;
        this.openRewriteRecipeGenerator = openRewriteRecipeGenerator;
    }

    public GovernanceOutcome executeGovernanceAndRemediation(
            Path projectPath,
            String runId,
            List<Finding> findings,
            AuditorConfig config,
            WorkflowStateRenderer renderer
    ) {
        log.info("🛡️ Executing Governance and Remediation Sub-Process for runId='{}'", runId);

        OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome = null;
        if (enterprisePolicyRegistry != null && opaPolicyEvaluator != null) {
            String policy = enterprisePolicyRegistry.resolveEffectivePolicy(projectPath);
            opaOutcome = opaPolicyEvaluator.evaluateFindings(findings, policy);
            if (renderer != null) {
                renderer.recordStepStatus(ProcessStepConstants.STEP_OPA_POLICY_EVALUATION, StepExecutionStatus.EXECUTED);
            }
        }

        File sarifFile = null;
        if (sarifReportExporter != null) {
            Path targetSarifPath = (projectPath != null && Files.isDirectory(projectPath))
                    ? projectPath.resolve("target/audit-results.sarif")
                    : (projectPath != null ? projectPath : Path.of("target/audit-results.sarif"));

            try {
                if (targetSarifPath.getParent() != null) {
                    Files.createDirectories(targetSarifPath.getParent());
                }
                sarifFile = sarifReportExporter.exportSarifReport(findings, targetSarifPath);
            } catch (Exception e) {
                log.warn("⚠️ Failed to export SARIF report: {}", e.getMessage(), e);
            }

            if (renderer != null) {
                renderer.recordStepStatus(ProcessStepConstants.STEP_SARIF_REPORT_EXPORT, StepExecutionStatus.EXECUTED);
            }
        }

        List<String> recipes = new ArrayList<>();
        if (findings != null) {
            for (Finding finding : findings) {
                if (openRewriteRecipeGenerator != null) {
                    String recipeYaml = openRewriteRecipeGenerator.synthesizeRecipe(finding);
                    recipes.add(recipeYaml);
                    log.info("Generated OpenRewrite patch for finding {}: \n{}", finding.id(), recipeYaml);
                }
            }
        }

        return new GovernanceOutcome(
                true,
                recipes.size(),
                recipes,
                "Governance and remediation pipeline executed successfully.",
                sarifFile,
                opaOutcome != null ? opaOutcome : new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW, 0, 0, List.of())
        );
    }

    public void executeRemediationPipeline(List<Finding> findings) {
        executeGovernanceAndRemediation(null, "run-legacy", findings, null, null);
    }
}

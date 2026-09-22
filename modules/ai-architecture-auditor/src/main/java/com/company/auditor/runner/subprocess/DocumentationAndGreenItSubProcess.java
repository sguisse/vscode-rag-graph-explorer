package com.company.auditor.runner.subprocess;

import com.company.auditor.analyzers.greenit.GreenItProfiler;
import com.company.auditor.analyzers.security.VexReachabilityAnalyzer;
import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.docascode.C4DiagramExtractor;
import com.company.auditor.docascode.DocAsCodeSyncEngine;
import com.company.auditor.docgen.BusinessRuleInverter;
import com.company.auditor.docgen.GherkinScenarioValidator;
import com.company.auditor.runner.ProcessStepConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * SubProcess 2: Doc-as-Code Synchronization, C4 Diagram Export, Green IT Profiling & OpenVEX Reachability.
 */
@Component
public class DocumentationAndGreenItSubProcess {

    private static final Logger log = LoggerFactory.getLogger(DocumentationAndGreenItSubProcess.class);

    private final DocAsCodeSyncEngine docAsCodeSyncEngine;
    private final C4DiagramExtractor c4DiagramExtractor;
    private final BusinessRuleInverter businessRuleInverter;
    private final GherkinScenarioValidator gherkinScenarioValidator;
    private final GreenItProfiler greenItProfiler;
    private final VexReachabilityAnalyzer vexReachabilityAnalyzer;

    public DocumentationAndGreenItSubProcess(DocAsCodeSyncEngine docAsCodeSyncEngine,
                                             C4DiagramExtractor c4DiagramExtractor,
                                             BusinessRuleInverter businessRuleInverter,
                                             GherkinScenarioValidator gherkinScenarioValidator,
                                             GreenItProfiler greenItProfiler,
                                             VexReachabilityAnalyzer vexReachabilityAnalyzer) {
        this.docAsCodeSyncEngine = docAsCodeSyncEngine;
        this.c4DiagramExtractor = c4DiagramExtractor;
        this.businessRuleInverter = businessRuleInverter;
        this.gherkinScenarioValidator = gherkinScenarioValidator;
        this.greenItProfiler = greenItProfiler;
        this.vexReachabilityAnalyzer = vexReachabilityAnalyzer;
    }

    public List<Observation> executeDocumentationAndGreenIt(Path repoPath, String runId, AuditorConfig config, WorkflowStateRenderer workflowStateRenderer) {
        List<Observation> observations = new ArrayList<>();

        log.info("➡️ Step 5: Synchronizing Doc-as-Code, exporting C4 diagrams, and inverting business decision rules");
        if (isStepEnabled(config, ProcessStepConstants.KEY_DOC_AS_CODE_SYNC) && docAsCodeSyncEngine != null) {
            observations.addAll(docAsCodeSyncEngine.synchronizeDocAsCode(repoPath, runId));
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_DOC_AS_CODE_SYNC, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_DOC_AS_CODE_SYNC, StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, ProcessStepConstants.KEY_C4_DIAGRAM_EXPORT) && c4DiagramExtractor != null) {
            c4DiagramExtractor.exportC4Diagrams(repoPath, runId, config);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_C4_DIAGRAM_EXPORT, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_C4_DIAGRAM_EXPORT, StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, ProcessStepConstants.KEY_BUSINESS_RULE_INVERSION) && businessRuleInverter != null) {
            businessRuleInverter.invertBusinessRulesToMarkdown(repoPath, runId);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_BUSINESS_RULE_INVERSION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_BUSINESS_RULE_INVERSION, StepExecutionStatus.DISABLED);
        }

        if (gherkinScenarioValidator != null) {
            observations.addAll(gherkinScenarioValidator.validateGherkinEventStormingAlignment(repoPath, runId));
        }

        log.info("➡️ Step 6: Profiling Green IT carbon metrics and evaluating CVE call-graph reachability (OpenVEX)");
        if (isStepEnabled(config, ProcessStepConstants.KEY_GREEN_IT_PROFILING) && greenItProfiler != null) {
            observations.addAll(greenItProfiler.profileEnergyInefficiencies(repoPath, runId));
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_GREEN_IT_PROFILING, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_GREEN_IT_PROFILING, StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, ProcessStepConstants.KEY_VEX_REACHABILITY) && vexReachabilityAnalyzer != null) {
            vexReachabilityAnalyzer.analyzeCveReachability(runId, List.of("CVE-2021-44228"));
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_VEX_REACHABILITY_ANALYSIS, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_VEX_REACHABILITY_ANALYSIS, StepExecutionStatus.DISABLED);
        }

        return observations;
    }

    private boolean isStepEnabled(AuditorConfig config, String stepKey) {
        if (config == null || config.workflow() == null || config.workflow().steps() == null) {
            return true;
        }
        AuditorConfig.StepConfig stepConfig = config.workflow().steps().get(stepKey);
        return stepConfig == null || stepConfig.enabled();
    }
}
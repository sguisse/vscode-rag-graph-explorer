package com.company.auditor.runner.subprocess;

import com.company.auditor.analyzers.greenit.GreenItProfiler;
import com.company.auditor.analyzers.security.VexReachabilityAnalyzer;
import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.docgen.BusinessRuleInversionEngine;
import com.company.auditor.docgen.C4DiagramExtractor;
import com.company.auditor.docgen.DocAsCodeSyncEngine;
import com.company.auditor.runner.ProcessStepConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * SubProcess 2: Doc-as-Code Synchronization, C4 Diagram Generation, Green IT Footprint Profiling & VEX CVE Reachability.
 */
@Component
public class DocumentationAndGreenItSubProcess {

    private static final Logger log = LoggerFactory.getLogger(DocumentationAndGreenItSubProcess.class);

    private final DocAsCodeSyncEngine docAsCodeSyncEngine;
    private final C4DiagramExtractor c4DiagramExtractor;
    private final BusinessRuleInversionEngine businessRuleInversionEngine;
    private final GreenItProfiler greenItProfiler;
    private final VexReachabilityAnalyzer vexReachabilityAnalyzer;

    public DocumentationAndGreenItSubProcess(DocAsCodeSyncEngine docAsCodeSyncEngine,
                                              C4DiagramExtractor c4DiagramExtractor,
                                              BusinessRuleInversionEngine businessRuleInversionEngine,
                                              GreenItProfiler greenItProfiler,
                                              VexReachabilityAnalyzer vexReachabilityAnalyzer) {
        this.docAsCodeSyncEngine = docAsCodeSyncEngine;
        this.c4DiagramExtractor = c4DiagramExtractor;
        this.businessRuleInversionEngine = businessRuleInversionEngine;
        this.greenItProfiler = greenItProfiler;
        this.vexReachabilityAnalyzer = vexReachabilityAnalyzer;
    }

    public List<Observation> executeDocumentationAndGreenIt(Path repoPath, String runId, AuditorConfig config, WorkflowStateRenderer workflowStateRenderer) {
        List<Observation> observations = new ArrayList<>();

        log.info("➡️ Step 6: Doc-as-Code Sync, C4 Diagrams & Business Rule Matrix Inversion");
        if (docAsCodeSyncEngine != null && isStepEnabled(config, ProcessStepConstants.KEY_DOC_AS_CODE_SYNC)) {
            docAsCodeSyncEngine.syncDocAsCode(repoPath, runId);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_DOC_AS_CODE_SYNC, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_DOC_AS_CODE_SYNC, StepExecutionStatus.DISABLED);
        }

        if (c4DiagramExtractor != null && isStepEnabled(config, ProcessStepConstants.KEY_C4_DIAGRAM_EXPORT)) {
            c4DiagramExtractor.exportC4Diagrams(repoPath, runId);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_C4_DIAGRAM_EXPORT, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_C4_DIAGRAM_EXPORT, StepExecutionStatus.DISABLED);
        }

        if (businessRuleInversionEngine != null && isStepEnabled(config, ProcessStepConstants.KEY_BUSINESS_RULE_INVERSION)) {
            businessRuleInversionEngine.invertBusinessRules(repoPath, runId);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_BUSINESS_RULE_INVERSION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_BUSINESS_RULE_INVERSION, StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 7: Green IT Profiling & Software Energy/Carbon Intensity Footprint");
        if (greenItProfiler != null && isStepEnabled(config, ProcessStepConstants.KEY_GREEN_IT_PROFILING)) {
            GreenItProfiler.GreenItReport report = greenItProfiler.profileGreenItEfficiency(runId);
            if (report != null && report.observations() != null) {
                observations.addAll(report.observations());
            }
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_GREEN_IT_PROFILING, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_GREEN_IT_PROFILING, StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 8: OpenVEX & CVE Call-Graph Reachability Analysis");
        if (vexReachabilityAnalyzer != null && isStepEnabled(config, ProcessStepConstants.KEY_VEX_REACHABILITY)) {
            List<VexReachabilityAnalyzer.VexReachabilityResult> vexResults = vexReachabilityAnalyzer.analyzeCveReachability(runId, List.of("CVE-2023-34055", "CVE-2024-22233"));
            if (vexResults != null) {
                for (VexReachabilityAnalyzer.VexReachabilityResult res : vexResults) {
                    if (res != null && res.observations() != null) {
                        observations.addAll(res.observations());
                    }
                }
            }
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
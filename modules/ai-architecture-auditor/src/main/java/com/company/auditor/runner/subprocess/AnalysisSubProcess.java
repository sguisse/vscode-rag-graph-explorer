package com.company.auditor.runner.subprocess;

import com.company.auditor.analyzers.infrastructure.K8sManifestAnalyzer;
import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.crossstack.CrossStackAligner;
import com.company.auditor.crossstack.PactMswContractGenerator;
import com.company.auditor.dag.PredictiveBlastRadius;
import com.company.auditor.drivers.java.JavaSpringDriver;
import com.company.auditor.runner.ProcessStepConstants;
import com.company.auditor.telemetry.OtelTraceHydrator;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * SubProcess 1: Static Rules Execution, AST Graph Extraction, Cross-Stack Alignment & Telemetry Hydration.
 */
@Component
public class AnalysisSubProcess {

    private static final Logger log = LoggerFactory.getLogger(AnalysisSubProcess.class);

    private final PredictiveBlastRadius predictiveBlastRadius;
    private final JavaSpringDriver javaSpringDriver;
    private final CrossStackAligner crossStackAligner;
    private final PactMswContractGenerator pactMswContractGenerator;
    private final OtelTraceHydrator otelTraceHydrator;
    private final K8sManifestAnalyzer k8sManifestAnalyzer;

    public AnalysisSubProcess(PredictiveBlastRadius predictiveBlastRadius,
                              JavaSpringDriver javaSpringDriver,
                              CrossStackAligner crossStackAligner,
                              PactMswContractGenerator pactMswContractGenerator,
                              OtelTraceHydrator otelTraceHydrator,
                              K8sManifestAnalyzer k8sManifestAnalyzer) {
        this.predictiveBlastRadius = predictiveBlastRadius;
        this.javaSpringDriver = javaSpringDriver;
        this.crossStackAligner = crossStackAligner;
        this.pactMswContractGenerator = pactMswContractGenerator;
        this.otelTraceHydrator = otelTraceHydrator;
        this.k8sManifestAnalyzer = k8sManifestAnalyzer;
    }

    public List<Observation> executeAnalysis(Path repoPath, String runId, AuditorConfig config, WorkflowStateRenderer workflowStateRenderer) {
        log.info("➡️ Step 1: Evaluating Predictive Blast Radius & ML Churn Risk");
        if (predictiveBlastRadius != null) {
            predictiveBlastRadius.calculatePredictiveBlastRadius(repoPath, List.of(), config);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_PREDICTIVE_BLAST_RADIUS, StepExecutionStatus.EXECUTED);
        }

        log.info("➡️ Step 2: Executing Java/Spring Boot Static Rule Suite and AST graph extraction");
        List<Observation> observations = new ArrayList<>();
        if (javaSpringDriver != null) {
            AnalysisContext context = new AnalysisContext(runId, repoPath, config);
            javaSpringDriver.buildCodeGraph(context);
            observations.addAll(javaSpringDriver.executeStaticRules(context));
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_STATIC_RULES_EXECUTION, StepExecutionStatus.EXECUTED);
        }

        log.info("➡️ Step 3: Checking Cross-Stack API Alignment & Pact/MSW Contracts");
        if (crossStackAligner != null) {
            CrossStackAligner.CrossStackAlignmentOutcome outcome = crossStackAligner.alignCrossStackContracts(runId);
            if (outcome != null && outcome.observations() != null) {
                observations.addAll(outcome.observations());
            }
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_CROSS_STACK_ALIGNER, StepExecutionStatus.EXECUTED);
        }

        log.info("➡️ Step 4: OpenTelemetry Trace Hydration & Runtime Observation Mapping");
        if (otelTraceHydrator != null && isStepEnabled(config, ProcessStepConstants.KEY_OTEL_HYDRATION)) {
            otelTraceHydrator.hydrateTraces(repoPath, runId);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 5: K8s Infrastructure & Manifest Drift Analysis");
        if (k8sManifestAnalyzer != null && isStepEnabled(config, ProcessStepConstants.KEY_K8S_MANIFEST_DRIFT)) {
            k8sManifestAnalyzer.analyzeManifests(repoPath, runId);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_K8S_MANIFEST_ANALYZER, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_K8S_MANIFEST_ANALYZER, StepExecutionStatus.DISABLED);
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
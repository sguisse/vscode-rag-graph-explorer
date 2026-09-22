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
import java.util.Map;

/**
 * SubProcess 1: Static Rules, AST, Cross-Stack Alignment & Telemetry Analysis.
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
        log.info("➡️ Step 2: Calculating predictive blast radius and DAG execution pruning");
        boolean isPbrEnabled = config != null && config.workflow() != null
                && config.workflow().predictiveBlastRadius() != null
                && config.workflow().predictiveBlastRadius().enabled();

        if (isPbrEnabled && predictiveBlastRadius != null) {
            predictiveBlastRadius.calculatePredictiveBlastRadius(repoPath, List.of(), config);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_PREDICTIVE_BLAST_RADIUS, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_PREDICTIVE_BLAST_RADIUS, StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 3: Executing static architecture rules across multi-language SPI drivers");
        List<Observation> observations = new ArrayList<>();
        if (isStepEnabled(config, ProcessStepConstants.KEY_STATIC_RULES)) {
            AnalysisContext context = new AnalysisContext(
                    runId,
                    repoPath,
                    Map.of(),
                    Map.of(),
                    List.of(),
                    config != null ? config.filters() : null
            );
            observations.addAll(javaSpringDriver.executeStaticRules(context));
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_STATIC_RULES_EXECUTION, StepExecutionStatus.EXECUTED);

            if (crossStackAligner != null) {
                observations.addAll(crossStackAligner.auditCrossStackAlignment(repoPath, runId));
            }
            if (pactMswContractGenerator != null) {
                pactMswContractGenerator.generateContracts(repoPath, runId);
            }
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_STATIC_RULES_EXECUTION, StepExecutionStatus.DISABLED);
        }

        log.info("➡️ Step 4: Ingesting OpenTelemetry runtime telemetry and auditing Kubernetes/Helm manifest drift");
        if (isStepEnabled(config, ProcessStepConstants.KEY_OTEL_HYDRATION) && otelTraceHydrator != null) {
            observations.addAll(otelTraceHydrator.hydrateRuntimeTelemetry(repoPath, runId));
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, ProcessStepConstants.KEY_K8S_MANIFEST_DRIFT) && k8sManifestAnalyzer != null) {
            observations.addAll(k8sManifestAnalyzer.analyzeK8sManifestDrift(repoPath, runId));
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
package com.company.auditor.config;

import com.company.auditor.runner.ProcessStepConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Console, Logger, and BPMN PlantUML DAG Flowchart Renderer (Epic 12 / Blueprint V4.0).
 * Generates PlantUML flowcharts with status-colored task cards and inter-step dependencies.
 */
@Component
public class WorkflowStateRenderer {

    private static final Logger log = LoggerFactory.getLogger(WorkflowStateRenderer.class);
    private final Map<String, StepExecutionStatus> stepStatuses = new ConcurrentHashMap<>();

    public enum StepExecutionStatus {
        EXECUTED("#28a745"),
        ACTIVATED_NOT_EXECUTED("#007bff"),
        DISABLED("#6c757d"),
        ERROR("#dc3545"),
        PENDING("#ffc107"),
        RUNNING("#17a2b8"),
        COMPLETED("#28a745"),
        FAILED("#dc3545"),
        SKIPPED("#6c757d"),
        IN_PROGRESS("#17a2b8"),
        SUCCESS("#28a745"),
        PASSED("#28a745");

        private final String hexColor;

        StepExecutionStatus(String hexColor) {
            this.hexColor = hexColor;
        }

        public String getHexColor() {
            return hexColor;
        }
    }

    public WorkflowStateRenderer() {}

    public void recordStepStatus(String stepName, StepExecutionStatus status) {
        if (stepName != null && status != null) {
            stepStatuses.put(stepName, status);
        }
        log.debug("Recorded workflow step status: [{}] -> {}", stepName, status);
    }

    public void recordStepStatus(String stage, String stepName, StepExecutionStatus status) {
        recordStepStatus(stepName, status);
    }

    public StepExecutionStatus getStepStatus(String stepName) {
        return stepStatuses.getOrDefault(stepName, StepExecutionStatus.DISABLED);
    }

    public void renderStageHeader(String stageName) {
        log.info("==========================================");
        log.info("STAGE: {}", stageName);
        log.info("==========================================");
    }

    public void renderStage(String stageName) {
        renderStageHeader(stageName);
    }

    public void renderState(String stage, String status) {
        log.info("[{}] {}", stage, status);
    }

    public void renderStep(String stepName, StepExecutionStatus status) {
        log.info("  └─ [{}] {}", stepName, status);
    }

    public void renderStep(String stage, String stepName, StepExecutionStatus status) {
        log.info("  └─ [{}] [{}] {}", stage, stepName, status);
    }

    public Path renderWorkflowPlantUml(Path repositoryPath, String runId) {
        log.info("📊 Rendering workflow execution state PlantUML flowchart for runId={}", runId);
        StringBuilder puml = new StringBuilder();
        puml.append("@startuml\n");
        puml.append("title \"Master Architecture Audit Workflow Execution DAG [RunID: ").append(runId).append("]\"\n\n");
        puml.append("rectangle \"AuditorCliRunner (Main Orchestrator)\" #FAFAFA {\n\n");

        puml.append("  ' BPMN Control Event Nodes\n");
        puml.append("  circle \"Start\" as START #28a745\n");
        puml.append("  circle \"End\" as END #dc3545\n\n");

        puml.append("  rectangle \"AnalysisSubProcess\" #E3F2FD {\n");
        appendCardNode(puml, ProcessStepConstants.STEP_PREDICTIVE_BLAST_RADIUS, "A1");
        appendCardNode(puml, ProcessStepConstants.STEP_STATIC_RULES_EXECUTION, "A2");
        appendCardNode(puml, ProcessStepConstants.STEP_CROSS_STACK_ALIGNER, "A3");
        appendCardNode(puml, ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, "A4");
        appendCardNode(puml, ProcessStepConstants.STEP_K8S_MANIFEST_ANALYZER, "A5");
        puml.append("  }\n\n");

        puml.append("  rectangle \"DocumentationAndGreenItSubProcess\" #E8F5E9 {\n");
        appendCardNode(puml, ProcessStepConstants.STEP_DOC_AS_CODE_SYNC, "B1");
        appendCardNode(puml, ProcessStepConstants.STEP_C4_DIAGRAM_EXPORT, "B2");
        appendCardNode(puml, ProcessStepConstants.STEP_BUSINESS_RULE_INVERSION, "B3");
        appendCardNode(puml, ProcessStepConstants.STEP_GREEN_IT_PROFILING, "B4");
        appendCardNode(puml, ProcessStepConstants.STEP_VEX_REACHABILITY_ANALYSIS, "B5");
        puml.append("  }\n\n");

        puml.append("  rectangle \"LlmTriageSubProcess\" #FFF3E0 {\n");
        appendCardNode(puml, ProcessStepConstants.STEP_ZERO_TRUST_ANONYMIZATION, "C1");
        appendCardNode(puml, ProcessStepConstants.STEP_LLM_TRIAGE_AND_METRICS, "C2");
        puml.append("  }\n\n");

        puml.append("  rectangle \"GovernanceAndRemediationSubProcess\" #F3E5F5 {\n");
        appendCardNode(puml, ProcessStepConstants.STEP_OPA_POLICY_EVALUATION, "D1");
        appendCardNode(puml, ProcessStepConstants.STEP_EXECUTIVE_COMPLIANCE_REPORT, "D2");
        appendCardNode(puml, ProcessStepConstants.STEP_DOUBLE_LOOP_REMEDIATION, "D3");
        appendCardNode(puml, ProcessStepConstants.STEP_MODEL_DISTILLATION_EXPORT, "D4");
        appendCardNode(puml, ProcessStepConstants.STEP_SARIF_REPORT_EXPORT, "D5");
        puml.append("  }\n\n");

        puml.append("  START --> A1\n\n");

        puml.append("  A1 --> A2\n");
        puml.append("  A2 --> A3\n");
        puml.append("  A2 --> A4\n");
        puml.append("  A2 --> A5\n\n");

        puml.append("  A2 --> B1\n");
        puml.append("  A2 --> B2\n");
        puml.append("  A2 --> B3\n");
        puml.append("  A2 --> B4\n");
        puml.append("  A2 --> B5\n\n");

        puml.append("  A2 --> C2\n");
        puml.append("  C1 --> C2\n\n");

        puml.append("  A2 --> D1\n");
        puml.append("  D1 --> D2\n");
        puml.append("  D1 --> D3\n");
        puml.append("  C2 --> D4\n");
        puml.append("  D1 --> D5\n\n");

        puml.append("  D2 --> END\n");
        puml.append("  D3 --> END\n");
        puml.append("  D4 --> END\n");
        puml.append("  D5 --> END\n");
        puml.append("}\n\n");

        puml.append("legend right\n");
        puml.append("  |= Status Color |= Task Execution State |\n");
        puml.append("  |<#28a745>| **EXECUTED** - Task completed successfully |\n");
        puml.append("  |<#007bff>| **ACTIVATED_NOT_EXECUTED** - Task enabled but skipped |\n");
        puml.append("  |<#6c757d>| **DISABLED** - Task skipped/inactive |\n");
        puml.append("  |<#dc3545>| **ERROR** - Task failed with error |\n");
        puml.append("  |--|--|\n");
        puml.append("  |= Symbol |= BPMN Control Event |\n");
        puml.append("  |<#28a745>| **Start Event** (Green Circle) |\n");
        puml.append("  |<#dc3545>| **End Event** (Red Circle) |\n");
        puml.append("  |--|--|\n");
        puml.append("  |= Sub-Process |= Stage Category |\n");
        puml.append("  |<#E3F2FD>| Analysis |\n");
        puml.append("  |<#E8F5E9>| Documentation & GreenIT |\n");
        puml.append("  |<#FFF3E0>| LLM Triage |\n");
        puml.append("  |<#F3E5F5>| Governance & Remediation |\n");
        puml.append("endlegend\n\n");

        puml.append("@enduml\n");

        String pumlString = puml.toString();
        Path pumlPath = repositoryPath != null
                ? repositoryPath.resolve("target/workflow-execution-state.puml")
                : Path.of("target/workflow-execution-state.puml");

        try {
            if (pumlPath.getParent() != null) {
                Files.createDirectories(pumlPath.getParent());
            }
            Files.writeString(pumlPath, pumlString);
            log.info("✅ Workflow execution state PlantUML written to: {}", pumlPath.toAbsolutePath());
            return pumlPath;
        } catch (Exception e) {
            log.error("Failed to write workflow PlantUML diagram: {}", e.getMessage(), e);
            return pumlPath;
        }
    }

    private void appendCardNode(StringBuilder puml, String stepName, String alias) {
        StepExecutionStatus status = getStepStatus(stepName);
        puml.append("    card \"").append(stepName).append(" [").append(status.name()).append("]\" as ").append(alias).append(" ").append(status.getHexColor()).append("\n");
    }
}
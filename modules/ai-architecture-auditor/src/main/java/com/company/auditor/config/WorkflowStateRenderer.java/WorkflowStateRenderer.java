package com.company.auditor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Color-Coded PlantUML Workflow State & DAG Dependency Flowchart Renderer (Story 12.1).
 * Generates PlantUML flowchart diagrams representing step dependencies, execution states (Green), skipped steps (Blue), and disabled steps (Red).
 */
@Component
public class WorkflowStateRenderer {

    private static final Logger log = LoggerFactory.getLogger(WorkflowStateRenderer.class);

    public enum StepExecutionStatus {
        EXECUTED("#28a745"),          // GREEN: Step enabled & executed
        ACTIVATED_NOT_EXECUTED("#007bff"), // BLUE: Step enabled but skipped
        DISABLED("#dc3545");            // RED: Step disabled via config

        private final String hexColor;

        StepExecutionStatus(String hexColor) {
            this.hexColor = hexColor;
        }

        public String getHexColor() {
            return hexColor;
        }
    }

    private final Map<String, StepExecutionStatus> stepStatusMap = new LinkedHashMap<>();

    public void recordStepStatus(String stepName, StepExecutionStatus status) {
        stepStatusMap.put(stepName, status);
    }

    public Path renderWorkflowPlantUml(Path outputDirectory, String runId) {
        log.info("🎨 Rendering PlantUML step dependency flowchart for runId={}", runId);

        StringBuilder puml = new StringBuilder();
        puml.append("@startuml Global_Workflow_Execution_State\n");
        puml.append("title Architecture Audit Workflow Step Dependencies & Execution State (Run ID: ").append(runId).append(")\n\n");
        puml.append("skinparam rectangle {\n");
        puml.append("  FontColor white\n");
        puml.append("  BorderColor black\n");
        puml.append("  FontSize 12\n");
        puml.append("}\n\n");

        // Render Step Blocks with Status Colors
        puml.append("rectangle \"Predictive Blast Radius\" as step_blast ").append(getStatusColor("PredictiveBlastRadius")).append("\n");
        puml.append("rectangle \"Zero-Trust Anonymization\" as step_zero_trust ").append(getStatusColor("ZeroTrustAnonymization")).append("\n");
        puml.append("rectangle \"SARIF Export\" as step_sarif ").append(getStatusColor("SarifReportExport")).append("\n\n");

        puml.append("rectangle \"Static Rules Execution\" as step_static ").append(getStatusColor("StaticRulesExecution")).append("\n\n");

        puml.append("rectangle \"OpenTelemetry Hydration\" as step_otel ").append(getStatusColor("OpenTelemetryHydration")).append("\n");
        puml.append("rectangle \"K8s Manifest Drift\" as step_k8s ").append(getStatusColor("K8sManifestAnalyzer")).append("\n");
        puml.append("rectangle \"Doc-as-Code Sync\" as step_doc ").append(getStatusColor("DocAsCodeSync")).append("\n");
        puml.append("rectangle \"C4 Diagram Export\" as step_c4 ").append(getStatusColor("C4DiagramExport")).append("\n");
        puml.append("rectangle \"Business Rule Inversion\" as step_biz ").append(getStatusColor("BusinessRuleInversion")).append("\n");
        puml.append("rectangle \"Green IT Profiling\" as step_green ").append(getStatusColor("GreenItProfiling")).append("\n");
        puml.append("rectangle \"OpenVEX Reachability\" as step_vex ").append(getStatusColor("VexReachabilityAnalysis")).append("\n");
        puml.append("rectangle \"OPA Policy Evaluation\" as step_opa ").append(getStatusColor("OpaPolicyEvaluation")).append("\n\n");

        puml.append("rectangle \"LLM Triage\" as step_llm ").append(getStatusColor("LlmTriageAndMetrics")).append("\n");
        puml.append("rectangle \"Shadow Remediation\" as step_remediation ").append(getStatusColor("DoubleLoopRemediation")).append("\n");
        puml.append("rectangle \"Model Distillation Export\" as step_distillation ").append(getStatusColor("ModelDistillationExport")).append("\n\n");

        // Render Step Dependency Edges (DAG)
        puml.append("step_static --> step_otel : depends on\n");
        puml.append("step_static --> step_k8s : depends on\n");
        puml.append("step_static --> step_doc : depends on\n");
        puml.append("step_static --> step_c4 : depends on\n");
        puml.append("step_static --> step_biz : depends on\n");
        puml.append("step_static --> step_green : depends on\n");
        puml.append("step_static --> step_vex : depends on\n");
        puml.append("step_static --> step_opa : depends on\n\n");

        puml.append("step_static --> step_llm : depends on\n");
        puml.append("step_zero_trust --> step_llm : depends on\n\n");

        puml.append("step_opa --> step_remediation : depends on\n");
        puml.append("step_llm --> step_distillation : depends on\n\n");

        // Legend
        puml.append("legend right\n");
        puml.append("  |<#28a745>   | Executed Successfully (Green) |\n");
        puml.append("  |<#007bff>   | Activated Step Skipped / Bypassed (Blue) |\n");
        puml.append("  |<#dc3545>   | Step Disabled via Config (Red) |\n");
        puml.append("endlegend\n\n");

        puml.append("@enduml\n");

        Path pumlPath = outputDirectory.resolve("target/workflow-execution-state.puml");
        try {
            Files.createDirectories(pumlPath.getParent());
            Files.writeString(pumlPath, puml.toString());
            log.info("✅ Global workflow execution flowchart exported to: {}", pumlPath.toAbsolutePath());
            return pumlPath.toAbsolutePath();
        } catch (Exception e) {
            log.error("Failed to write workflow execution PlantUML diagram: {}", e.getMessage());
            return pumlPath;
        }
    }

    private String getStatusColor(String stepName) {
        StepExecutionStatus status = stepStatusMap.getOrDefault(stepName, StepExecutionStatus.EXECUTED);
        return status.getHexColor();
    }
}
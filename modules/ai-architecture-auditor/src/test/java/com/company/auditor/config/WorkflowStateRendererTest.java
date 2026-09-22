package com.company.auditor.config;

import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.runner.ProcessStepConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class WorkflowStateRendererTest {

    @Test
    @DisplayName("Should render BPMN PlantUML flowchart with start/end nodes, sub-process rectangles, step status colors, and DAG dependencies")
    void testRenderWorkflowPlantUml_GeneratesValidBpmnFlowchart(@TempDir Path tempRepo) throws Exception {
        // Arrange
        WorkflowStateRenderer renderer = new WorkflowStateRenderer();
        String runId = "test-run-12345";

        renderer.recordStepStatus(ProcessStepConstants.STEP_PREDICTIVE_BLAST_RADIUS, StepExecutionStatus.EXECUTED);
        renderer.recordStepStatus(ProcessStepConstants.STEP_STATIC_RULES_EXECUTION, StepExecutionStatus.EXECUTED);
        renderer.recordStepStatus(ProcessStepConstants.STEP_CROSS_STACK_ALIGNER, StepExecutionStatus.DISABLED);
        renderer.recordStepStatus(ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, StepExecutionStatus.DISABLED);
        renderer.recordStepStatus(ProcessStepConstants.STEP_K8S_MANIFEST_ANALYZER, StepExecutionStatus.EXECUTED);
        renderer.recordStepStatus(ProcessStepConstants.STEP_DOUBLE_LOOP_REMEDIATION, StepExecutionStatus.ACTIVATED_NOT_EXECUTED);

        // Act
        Path pumlPath = renderer.renderWorkflowPlantUml(tempRepo, runId);

        // Assert
        assertNotNull(pumlPath);
        assertTrue(Files.exists(pumlPath));

        String content = Files.readString(pumlPath);

        // 1. Verify Title & Orchestrator Container
        assertTrue(content.contains("title \"Master Architecture Audit Workflow Execution DAG [RunID: " + runId + "]\""));
        assertTrue(content.contains("rectangle \"AuditorCliRunner (Main Orchestrator)\" #FAFAFA"));

        // 2. Verify BPMN Control Nodes
        assertTrue(content.contains("circle \"Start\" as START #28a745"));
        assertTrue(content.contains("circle \"End\" as END #dc3545"));
        assertTrue(content.contains("START --> A1"));
        assertTrue(content.contains("D2 --> END"));

        // 3. Verify SubProcess Containers & Colors
        assertTrue(content.contains("rectangle \"AnalysisSubProcess\" #E3F2FD"));
        assertTrue(content.contains("rectangle \"DocumentationAndGreenItSubProcess\" #E8F5E9"));
        assertTrue(content.contains("rectangle \"LlmTriageSubProcess\" #FFF3E0"));
        assertTrue(content.contains("rectangle \"GovernanceAndRemediationSubProcess\" #F3E5F5"));

        // 4. Verify Status Hex Colors
        assertTrue(content.contains("PredictiveBlastRadius [EXECUTED]\" as A1 #28a745"));
        assertTrue(content.contains("CrossStackAligner [DISABLED]\" as A3 #6c757d"));
        assertTrue(content.contains("DoubleLoopRemediation [ACTIVATED_NOT_EXECUTED]\" as D3 #007bff"));

        // 5. Verify Inter-step DAG Dependencies
        assertTrue(content.contains("A1 --> A2"));
        assertTrue(content.contains("A2 --> B1"));
        assertTrue(content.contains("A2 --> C2"));
        assertTrue(content.contains("C1 --> C2"));
        assertTrue(content.contains("A2 --> D1"));

        // 6. Verify Legend Section
        assertTrue(content.contains("legend right"));
        assertTrue(content.contains("|<#28a745>| **EXECUTED** - Task completed successfully |"));
        assertTrue(content.contains("|<#28a745>| **Start Event** (Green Circle) |"));
        assertTrue(content.contains("endlegend"));
    }
}

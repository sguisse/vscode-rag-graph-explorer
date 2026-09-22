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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AnalysisSubProcessTest {

    @Mock private PredictiveBlastRadius predictiveBlastRadius;
    @Mock private JavaSpringDriver javaSpringDriver;
    @Mock private CrossStackAligner crossStackAligner;
    @Mock private PactMswContractGenerator pactMswContractGenerator;
    @Mock private OtelTraceHydrator otelTraceHydrator;
    @Mock private K8sManifestAnalyzer k8sManifestAnalyzer;
    @Mock private WorkflowStateRenderer workflowStateRenderer;

    private AnalysisSubProcess analysisSubProcess;

    @BeforeEach
    void setUp() {
        analysisSubProcess = new AnalysisSubProcess(
                predictiveBlastRadius,
                javaSpringDriver,
                crossStackAligner,
                pactMswContractGenerator,
                otelTraceHydrator,
                k8sManifestAnalyzer
        );
    }

    @Test
    @DisplayName("Should execute static rules and record step statuses for active steps")
    void testExecuteAnalysis_ExecutesActiveStepsAndRecordsStatus() {
        // Arrange
        Path repoPath = Paths.get(".");
        String runId = "run-101";
        AuditorConfig config = AuditorConfig.defaultConfig();

        Observation mockObs = new Observation("obs-1", runId, "HEX-001", "HIGH", null, java.util.Map.of("message", "Violation"), System.currentTimeMillis());
        when(javaSpringDriver.executeStaticRules(any(AnalysisContext.class))).thenReturn(List.of(mockObs));

        // Act
        List<Observation> results = analysisSubProcess.executeAnalysis(repoPath, runId, config, workflowStateRenderer);

        // Assert
        assertNotNull(results);
        assertEquals(1, results.size());

        verify(predictiveBlastRadius, times(1)).calculatePredictiveBlastRadius(repoPath, List.of(), config);
        verify(workflowStateRenderer, times(1)).recordStepStatus(ProcessStepConstants.STEP_PREDICTIVE_BLAST_RADIUS, StepExecutionStatus.EXECUTED);
        verify(workflowStateRenderer, times(1)).recordStepStatus(ProcessStepConstants.STEP_STATIC_RULES_EXECUTION, StepExecutionStatus.EXECUTED);
        verify(workflowStateRenderer, times(1)).recordStepStatus(ProcessStepConstants.STEP_OPENTELEMETRY_HYDRATION, StepExecutionStatus.DISABLED);
    }
}
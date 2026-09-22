package com.company.auditor.runner;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.AuditorConfigLoader;
import com.company.auditor.config.AuditorConfigValidator;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import com.company.auditor.persistence.repository.AuditWorkflowStateRepository;
import com.company.auditor.policy.OpaPolicyEvaluator;
import com.company.auditor.runner.subprocess.AnalysisSubProcess;
import com.company.auditor.runner.subprocess.DocumentationAndGreenItSubProcess;
import com.company.auditor.runner.subprocess.GovernanceAndRemediationSubProcess;
import com.company.auditor.runner.subprocess.LlmTriageSubProcess;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;

import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditorCliRunnerTest {

    @Mock private AuditWorkflowStateRepository workflowStateRepository;
    @Mock private AuditorConfigLoader configLoader;
    @Mock private AuditorConfigValidator configValidator;
    @Mock private WorkflowStateRenderer workflowStateRenderer;

    @Mock private AnalysisSubProcess analysisSubProcess;
    @Mock private DocumentationAndGreenItSubProcess documentationAndGreenItSubProcess;
    @Mock private LlmTriageSubProcess llmTriageSubProcess;
    @Mock private GovernanceAndRemediationSubProcess governanceAndRemediationSubProcess;

    private AuditorCliRunner auditorCliRunner;

    @BeforeEach
    void setUp() {
        auditorCliRunner = new AuditorCliRunner(
                workflowStateRepository,
                configLoader,
                configValidator,
                workflowStateRenderer,
                analysisSubProcess,
                documentationAndGreenItSubProcess,
                llmTriageSubProcess,
                governanceAndRemediationSubProcess
        );
    }

    @Test
    @DisplayName("Should orchestrate all 4 sub-processes sequentially and persist state transitions")
    void testRun_OrchestratesSubProcessesAndPersistsState() throws Exception {
        // Arrange
        AuditorConfig config = AuditorConfig.defaultConfig();
        when(configLoader.loadConfig(any(Path.class))).thenReturn(config);
        when(analysisSubProcess.executeAnalysis(any(Path.class), anyString(), eq(config), eq(workflowStateRenderer)))
                .thenReturn(List.of());
        when(documentationAndGreenItSubProcess.executeDocumentationAndGreenIt(any(Path.class), anyString(), eq(config), eq(workflowStateRenderer)))
                .thenReturn(List.of());

        GovernanceAndRemediationSubProcess.GovernanceOutcome mockOutcome =
                new GovernanceAndRemediationSubProcess.GovernanceOutcome(
                        new OpaPolicyEvaluator.OpaEvaluationOutcome(OpaPolicyEvaluator.PolicyResult.ALLOW, 0, 0, List.of()),
                        new File("target/audit-results.sarif")
                );
        when(governanceAndRemediationSubProcess.executeGovernanceAndRemediation(any(Path.class), anyString(), anyList(), eq(config), eq(workflowStateRenderer)))
                .thenReturn(mockOutcome);

        // Act
        auditorCliRunner.run(".");

        // Assert
        verify(workflowStateRepository, times(2)).save(any(AuditWorkflowStateEntity.class));
        verify(analysisSubProcess, times(1)).executeAnalysis(any(Path.class), anyString(), eq(config), eq(workflowStateRenderer));
        verify(documentationAndGreenItSubProcess, times(1)).executeDocumentationAndGreenIt(any(Path.class), anyString(), eq(config), eq(workflowStateRenderer));
        verify(llmTriageSubProcess, times(1)).executeLlmTriage(anyString(), anyList(), eq(config), eq(workflowStateRenderer));
        verify(governanceAndRemediationSubProcess, times(1)).executeGovernanceAndRemediation(any(Path.class), anyString(), anyList(), eq(config), eq(workflowStateRenderer));
        verify(workflowStateRenderer, times(1)).renderWorkflowPlantUml(any(Path.class), anyString());
    }
}
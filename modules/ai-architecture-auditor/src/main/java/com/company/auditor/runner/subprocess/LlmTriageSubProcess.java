package com.company.auditor.runner.subprocess;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.config.WorkflowStateRenderer.StepExecutionStatus;
import com.company.auditor.core.domain.GraphSubTree;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.graph.GraphRAGContextFetcher;
import com.company.auditor.core.llm.AuditTriageRequest;
import com.company.auditor.core.llm.AuditTriageResponse;
import com.company.auditor.core.llm.LlmGatewayClient;
import com.company.auditor.core.llm.TokenMetricsService;
import com.company.auditor.mcp.ZeroTrustEnclave;
import com.company.auditor.runner.ProcessStepConstants;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * SubProcess 3: Zero-Trust Prompt Anonymization & Semantic LLM Observation Triage.
 */
@Component
public class LlmTriageSubProcess {

    private static final Logger log = LoggerFactory.getLogger(LlmTriageSubProcess.class);

    private final ZeroTrustEnclave zeroTrustEnclave;
    private final LlmGatewayClient llmGatewayClient;
    private final TokenMetricsService tokenMetricsService;
    private final GraphRAGContextFetcher graphRAGContextFetcher;

    @Value("${llm.gateway.url:http://localhost:11434/api/generate}")
    private String llmEndpointUrl;

    @Value("${llm.model.name:qwen2.5-coder:1.5b}")
    private String modelName;

    public LlmTriageSubProcess(ZeroTrustEnclave zeroTrustEnclave,
                               LlmGatewayClient llmGatewayClient,
                               TokenMetricsService tokenMetricsService,
                               GraphRAGContextFetcher graphRAGContextFetcher) {
        this.zeroTrustEnclave = zeroTrustEnclave;
        this.llmGatewayClient = llmGatewayClient;
        this.tokenMetricsService = tokenMetricsService;
        this.graphRAGContextFetcher = graphRAGContextFetcher;
    }

    public void executeLlmTriage(String runId, List<Observation> observations, AuditorConfig config, WorkflowStateRenderer workflowStateRenderer) {
        log.info("➡️ Step 7: Executing Zero-Trust prompt sanitization and semantic LLM observation triage");
        if (isStepEnabled(config, ProcessStepConstants.KEY_ZERO_TRUST_ANONYMIZATION)) {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_ZERO_TRUST_ANONYMIZATION, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_ZERO_TRUST_ANONYMIZATION, StepExecutionStatus.DISABLED);
        }

        if (isStepEnabled(config, ProcessStepConstants.KEY_LLM_TRIAGE)) {
            performLlmTriageAndRecordMetrics(runId, observations);
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_LLM_TRIAGE_AND_METRICS, StepExecutionStatus.EXECUTED);
        } else {
            workflowStateRenderer.recordStepStatus(ProcessStepConstants.STEP_LLM_TRIAGE_AND_METRICS, StepExecutionStatus.DISABLED);
        }
    }

    private void performLlmTriageAndRecordMetrics(String runId, List<Observation> observations) {
        if (llmGatewayClient == null || tokenMetricsService == null || observations.isEmpty()) {
            return;
        }

        int total = observations.size();
        log.info("Starting LLM observation triage across {} observations...", total);

        for (int i = 0; i < total; i++) {
            Observation obs = observations.get(i);
            int progressPercent = (int) (((i + 1) * 100.0) / total);

            try {
                GraphSubTree subTree = new GraphSubTree(
                        obs.location() != null ? obs.location().symbol() : "N/A",
                        2,
                        List.of(),
                        List.of(),
                        0
                );
                if (graphRAGContextFetcher != null) {
                    try {
                        subTree = graphRAGContextFetcher.fetchContextForObservation(obs, 2);
                    } catch (Exception ignored) {
                    }
                }

                AuditTriageRequest triageRequest = new AuditTriageRequest(runId, obs, subTree, null);

                if (zeroTrustEnclave != null) {
                    ZeroTrustEnclave.AnonymizationContext anonymized = zeroTrustEnclave.sanitizePrompt(obs.message());
                    log.info("[{}%] 🛡️ Zero-Trust Privacy Enclave sanitized observation message [{}/{}] for LLM triage.",
                            progressPercent, (i + 1), total);
                }

                AuditTriageResponse response = llmGatewayClient.triageObservation(llmEndpointUrl, triageRequest);

                tokenMetricsService.recordMetrics(
                        runId,
                        modelName,
                        response.promptTokens(),
                        response.completionTokens(),
                        response.executionTimeMs()
                );

                log.info("[{}%] 🤖 LLM triage completed for observation [{}/{}] id=[{}]: TruePositive={}, Confidence={}",
                        progressPercent, (i + 1), total, obs.observationId(), response.isTruePositive(), response.confidenceScore());
            } catch (Exception e) {
                log.warn("[{}%] ⚠️ LLM triage skipped for observation [{}/{}]: id=[{}], error={}",
                        progressPercent, (i + 1), total, obs.observationId(), e.getMessage());
            }
        }
    }

    private boolean isStepEnabled(AuditorConfig config, String stepKey) {
        if (config == null || config.workflow() == null || config.workflow().steps() == null) {
            return true;
        }
        AuditorConfig.StepConfig stepConfig = config.workflow().steps().get(stepKey);
        return stepConfig == null || stepConfig.enabled();
    }
}
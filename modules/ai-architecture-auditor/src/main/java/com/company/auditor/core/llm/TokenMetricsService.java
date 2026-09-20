package com.company.auditor.core.llm;

import com.company.auditor.core.domain.TokenMetricsEntity;
import com.company.auditor.core.graph.TokenMetricsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Service tracking LLM token economics, latency, and financial costs per audit run.
 */
@Service
public class TokenMetricsService {

    private final TokenMetricsRepository repository;

    public TokenMetricsService(TokenMetricsRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void recordMetrics(String runId, String modelName, int promptTokens, int completionTokens, long latencyMs) {
        double costPer1kPrompt = 0.0015;
        double costPer1kCompletion = 0.0020;
        double calculatedCost = ((promptTokens / 1000.0) * costPer1kPrompt) + ((completionTokens / 1000.0) * costPer1kCompletion);

        TokenMetricsEntity entity = new TokenMetricsEntity(
                runId,
                modelName,
                promptTokens,
                completionTokens,
                latencyMs,
                calculatedCost,
                System.currentTimeMillis()
        );

        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public List<TokenMetricsEntity> getMetricsByRun(String runId) {
        return repository.findByRunId(runId);
    }
}
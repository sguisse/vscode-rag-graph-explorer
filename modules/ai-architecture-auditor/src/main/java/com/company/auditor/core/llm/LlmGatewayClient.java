package com.company.auditor.core.llm;

import com.company.auditor.gateway.GrammarConstrainedSampler;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

/**
 * Primary Spring @Component LLM Gateway Client bean (Story 3.3).
 */
@Component
public class LlmGatewayClient extends com.company.auditor.gateway.LlmGatewayClient {

    public LlmGatewayClient(GrammarConstrainedSampler grammarSampler, ObjectMapper objectMapper) {
        super(grammarSampler, objectMapper);
    }
}
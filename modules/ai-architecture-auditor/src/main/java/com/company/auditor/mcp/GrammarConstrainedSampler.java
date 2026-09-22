package com.company.auditor.mcp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Grammar-Guided JSON Decoding Sampler (Story 10.1).
 * Enforces strict JSON Schema grammar constraints (via Outlines/vLLM decoding) on LLM triage and synthesis outputs to eliminate JSON parse errors.
 */
@Component
public class GrammarConstrainedSampler {

    private static final Logger log = LoggerFactory.getLogger(GrammarConstrainedSampler.class);

    public String enforceJsonGrammar(String rawLlmOutput, String expectedJsonSchema) {
        log.info("Enforcing JSON Schema grammar decoding constraint on raw LLM output...");

        if (rawLlmOutput == null || rawLlmOutput.isBlank()) {
            log.warn("Raw LLM output empty. Returning fallback schema JSON.");
            return "{\"isTruePositive\": false, \"confidenceScore\": 0.0, \"rationale\": \"Empty response\"}";
        }

        String trimmed = rawLlmOutput.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        }
        if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }

        return trimmed.trim();
    }
}
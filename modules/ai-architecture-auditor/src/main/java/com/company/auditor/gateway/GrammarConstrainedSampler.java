package com.company.auditor.gateway;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Grammar-Constrained Sampler & JSON Schema Validator (Story 3.3).
 * Validates that LLM output contains mandatory fields and valid enum values prior to downstream consumption.
 */
@Component
public class GrammarConstrainedSampler {

    private static final Logger log = LoggerFactory.getLogger(GrammarConstrainedSampler.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean validateJsonSchema(String jsonText) {
        if (jsonText == null || jsonText.isBlank()) {
            return false;
        }

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(jsonText, Map.class);

            boolean hasAssessment = map.containsKey("assessment");
            boolean hasConfidence = map.containsKey("confidence");
            boolean hasReasoning = map.containsKey("reasoning");

            if (!hasAssessment || !hasConfidence || !hasReasoning) {
                log.warn("Missing required JSON fields in LLM response: assessment={}, confidence={}, reasoning={}",
                        hasAssessment, hasConfidence, hasReasoning);
                return false;
            }

            String assessment = String.valueOf(map.get("assessment"));
            return "CONFIRMED_VIOLATION".equals(assessment)
                    || "FALSE_POSITIVE".equals(assessment)
                    || "NEEDS_REVIEW".equals(assessment)
                    || "MANUAL_REVIEW_REQUIRED".equals(assessment);
        } catch (Exception e) {
            log.warn("Failed to parse JSON string for schema validation: {}", e.getMessage());
            return false;
        }
    }
}
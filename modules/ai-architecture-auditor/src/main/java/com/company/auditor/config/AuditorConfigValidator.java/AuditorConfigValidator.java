package com.company.auditor.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Pre-flight DAG Dependency Validation Engine (Story 12.1).
 * Ensures that if a step is enabled, all of its required precursor steps are also enabled.
 */
@Component
public class AuditorConfigValidator {

    private static final Logger log = LoggerFactory.getLogger(AuditorConfigValidator.class);

    public static class InvalidConfigurationException extends RuntimeException {
        public InvalidConfigurationException(String message) {
            super(message);
        }
    }

    public void validateConfiguration(AuditorConfig config) {
        log.info("🔍 Performing Pre-flight DAG Workflow Dependency Validation...");

        if (config.workflow() == null || config.workflow().steps() == null || config.workflow().steps().isEmpty()) {
            log.info("No explicit workflow step toggles defined. Using default DAG execution rules.");
            return;
        }

        Map<String, AuditorConfig.StepConfig> steps = config.workflow().steps();
        List<String> validationErrors = new ArrayList<>();

        for (Map.Entry<String, AuditorConfig.StepConfig> entry : steps.entrySet()) {
            String stepName = entry.getKey();
            AuditorConfig.StepConfig stepConfig = entry.getValue();

            if (stepConfig.enabled() && stepConfig.dependsOn() != null) {
                for (String dependency : stepConfig.dependsOn()) {
                    AuditorConfig.StepConfig depConfig = steps.get(dependency);
                    if (depConfig != null && !depConfig.enabled()) {
                        validationErrors.add("Step [" + stepName + "] is ENABLED but required dependency [" + dependency + "] is DISABLED.");
                    }
                }
            }
        }

        if (!validationErrors.isEmpty()) {
            String errorSummary = "❌ Pre-flight Configuration Validation Failed:\n - " + String.join("\n - ", validationErrors);
            log.error(errorSummary);
            throw new InvalidConfigurationException(errorSummary);
        }

        log.info("✅ Pre-flight Workflow DAG Dependency Validation PASSED successfully.");
    }
}
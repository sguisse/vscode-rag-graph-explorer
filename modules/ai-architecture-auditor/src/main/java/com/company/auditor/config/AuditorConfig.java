package com.company.auditor.config;

import com.company.auditor.runner.ProcessStepConstants;
import java.util.List;
import java.util.Map;

/**
 * Audit Engine Configuration Model (Story 12.1 & Blueprint V4.0).
 * Uses externalized step keys from ProcessStepConstants.
 */
public record AuditorConfig(
        String version,
        FilterConfig filters,
        WorkflowConfig workflow
) {
    public record FilterConfig(
            PackageFilterConfig packages,
            boolean ignoreExternalLibraries
    ) {}

    public record PackageFilterConfig(
            List<String> include,
            List<String> exclude
    ) {}

    public record WorkflowConfig(
            PredictiveBlastRadiusConfig predictiveBlastRadius,
            Map<String, StepConfig> steps
    ) {}

    public record PredictiveBlastRadiusConfig(
            boolean enabled,
            int churnThresholdDays,
            double mlPruningConfidence
    ) {
        public static PredictiveBlastRadiusConfig defaultConfig() {
            return new PredictiveBlastRadiusConfig(true, 90, 0.95);
        }
    }

    public record StepConfig(
            boolean enabled,
            List<String> dependsOn
    ) {}

    public static AuditorConfig defaultConfig() {
        return new AuditorConfig(
                "4.0",
                new FilterConfig(
                        new PackageFilterConfig(
                                List.of("com.company.auditor.*"),
                                List.of("com.company.auditor.legacy.*")
                        ),
                        true
                ),
                new WorkflowConfig(
                        PredictiveBlastRadiusConfig.defaultConfig(),
                        Map.ofEntries(
                                Map.entry(ProcessStepConstants.KEY_STATIC_RULES, new StepConfig(true, List.of())),
                                Map.entry(ProcessStepConstants.KEY_OTEL_HYDRATION, new StepConfig(false, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_K8S_MANIFEST_DRIFT, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_DOC_AS_CODE_SYNC, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_C4_DIAGRAM_EXPORT, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_BUSINESS_RULE_INVERSION, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_GREEN_IT_PROFILING, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_VEX_REACHABILITY, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_ZERO_TRUST_ANONYMIZATION, new StepConfig(true, List.of())),
                                Map.entry(ProcessStepConstants.KEY_LLM_TRIAGE, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES, ProcessStepConstants.KEY_ZERO_TRUST_ANONYMIZATION))),
                                Map.entry(ProcessStepConstants.KEY_OPA_POLICY_EVALUATION, new StepConfig(true, List.of(ProcessStepConstants.KEY_STATIC_RULES))),
                                Map.entry(ProcessStepConstants.KEY_SHADOW_REMEDIATION, new StepConfig(false, List.of(ProcessStepConstants.KEY_OPA_POLICY_EVALUATION))),
                                Map.entry(ProcessStepConstants.KEY_MODEL_DISTILLATION, new StepConfig(true, List.of(ProcessStepConstants.KEY_LLM_TRIAGE))),
                                Map.entry(ProcessStepConstants.KEY_SARIF_EXPORT, new StepConfig(true, List.of()))
                        )
                )
        );
    }
}
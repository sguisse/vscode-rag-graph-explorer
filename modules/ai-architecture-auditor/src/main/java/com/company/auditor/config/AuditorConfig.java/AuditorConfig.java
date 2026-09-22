package com.company.auditor.config;

import java.util.List;
import java.util.Map;

/**
 * Engine Configuration Model for ai-architecture-auditor.config.yaml (Story 12.1).
 */
public record AuditorConfig(
        String version,
        FilterConfig filters,
        WorkflowConfig workflow
) {
    public record FilterConfig(
            PackageFilters packages,
            boolean ignoreExternalLibraries
    ) {}

    public record PackageFilters(
            List<String> include,
            List<String> exclude
    ) {}

    public record WorkflowConfig(
            Map<String, StepConfig> steps
    ) {}

    public record StepConfig(
            boolean enabled,
            List<String> dependsOn
    ) {}

    public static AuditorConfig defaultConfig() {
        return new AuditorConfig(
                "4.0",
                new FilterConfig(new PackageFilters(List.of(".*"), List.of()), true),
                new WorkflowConfig(Map.of())
        );
    }
}
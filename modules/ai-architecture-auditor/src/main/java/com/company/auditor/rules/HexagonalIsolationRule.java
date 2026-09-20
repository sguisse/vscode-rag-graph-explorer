package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;

import java.util.*;
import java.util.regex.Pattern;

/**
 * HEX-001: Hexagonal Architecture Package Boundary Isolation Rule.
 * Enforces that core domain packages (.domain., .core.domain) never import
 * adapter, web, database, or infrastructure frameworks.
 */
public class HexagonalIsolationRule implements StaticArchitectureRule {

    private static final String RULE_ID = "HEX-001";
    private static final Pattern DOMAIN_PACKAGE_PATTERN = Pattern.compile(".*\\.(domain|core\\.domain)(\\..*)?");

    private static final List<String> FORBIDDEN_IMPORT_PREFIXES = List.of(
            "org.springframework.web",
            "org.springframework.data",
            "jakarta.persistence",
            "javax.persistence",
            "com.company.auditor.adapter",
            "com.company.auditor.infrastructure"
    );

    @Override
    public String getRuleId() {
        return RULE_ID;
    }

    @Override
    public String getName() {
        return "Hexagonal Package Boundary Isolation";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        List<Observation> observations = new ArrayList<>();

        context.parsedClasses().forEach((className, importList) -> {
            String packageName = extractPackageName(className);

            if (DOMAIN_PACKAGE_PATTERN.matcher(packageName).matches()) {
                for (String importStmt : importList) {
                    for (String forbiddenPrefix : FORBIDDEN_IMPORT_PREFIXES) {
                        if (importStmt.startsWith(forbiddenPrefix)) {
                            Observation observation = new Observation(
                                    UUID.randomUUID().toString(),
                                    RULE_ID,
                                    "HIGH",
                                    "Hexagonal Architecture Violation: Domain class '" + className +
                                            "' directly imports infrastructure package '" + importStmt + "'.",
                                    new Location(
                                            className.replace(".", "/") + ".java",
                                            1,
                                            1,
                                            className,
                                            "import " + importStmt + ";"
                                    ),
                                    Map.of(
                                            "domainClass", className,
                                            "forbiddenImport", importStmt,
                                            "ruleCategory", "ARCHITECTURE_BOUNDARY"
                                    ),
                                    System.currentTimeMillis()
                            );
                            observations.add(observation);
                        }
                    }
                }
            }
        });

        return observations;
    }

    private String extractPackageName(String fullyQualifiedClassName) {
        int lastDotIndex = fullyQualifiedClassName.lastIndexOf('.');
        return (lastDotIndex != -1) ? fullyQualifiedClassName.substring(0, lastDotIndex) : "";
    }
}
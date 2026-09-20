package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;

import java.util.*;

/**
 * DB-001: Transactional Boundary Demarcation Rule.
 * Validates that mutating service methods maintain explicit @Transactional boundaries,
 * and detects read-only methods missing readOnly = true settings.
 */
public class TransactionalBoundaryRule implements StaticArchitectureRule {

    private static final String RULE_ID = "DB-001";

    @Override
    public String getRuleId() {
        return RULE_ID;
    }

    @Override
    public String getName() {
        return "Transactional Demarcation & Read-Only Optimization";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        List<Observation> observations = new ArrayList<>();

        context.methodMetadata().forEach((methodKey, metadata) -> {
            boolean isServiceClass = metadata.getOrDefault("isService", "false").equals("true");
            boolean isMutatingMethod = metadata.getOrDefault("isMutating", "false").equals("true");
            boolean hasTransactional = metadata.getOrDefault("hasTransactional", "false").equals("true");
            boolean isReadOnlyTransactional = metadata.getOrDefault("isReadOnlyTransactional", "false").equals("true");

            if (isServiceClass && isMutatingMethod && !hasTransactional) {
                Observation observation = new Observation(
                        UUID.randomUUID().toString(),
                        RULE_ID,
                        "CRITICAL",
                        "Missing Transaction Boundary: Mutating service method '" + methodKey +
                                "' lacks @Transactional annotation, risking state inconsistency or rollback leaks.",
                        new Location(
                                metadata.getOrDefault("filePath", "unknown.java"),
                                Integer.parseInt(metadata.getOrDefault("lineStart", "1")),
                                Integer.parseInt(metadata.getOrDefault("lineEnd", "1")),
                                methodKey,
                                metadata.getOrDefault("snippet", "public void mutate(...)")
                        ),
                        Map.of(
                                "methodKey", methodKey,
                                "issueType", "MISSING_TRANSACTIONAL",
                                "ruleCategory", "DATABASE_INTEGRITY"
                        ),
                        System.currentTimeMillis()
                );
                observations.add(observation);
            }

            if (isServiceClass && !isMutatingMethod && hasTransactional && !isReadOnlyTransactional) {
                Observation observation = new Observation(
                        UUID.randomUUID().toString(),
                        RULE_ID,
                        "MEDIUM",
                        "Unoptimized Read Transaction: Query method '" + methodKey +
                                "' has @Transactional but lacks readOnly = true configuration.",
                        new Location(
                                metadata.getOrDefault("filePath", "unknown.java"),
                                Integer.parseInt(metadata.getOrDefault("lineStart", "1")),
                                Integer.parseInt(metadata.getOrDefault("lineEnd", "1")),
                                methodKey,
                                metadata.getOrDefault("snippet", "public List find(...)")
                        ),
                        Map.of(
                                "methodKey", methodKey,
                                "issueType", "MISSING_READ_ONLY_FLAG",
                                "ruleCategory", "DATABASE_OPTIMIZATION"
                        ),
                        System.currentTimeMillis()
                );
                observations.add(observation);
            }
        });

        return observations;
    }
}
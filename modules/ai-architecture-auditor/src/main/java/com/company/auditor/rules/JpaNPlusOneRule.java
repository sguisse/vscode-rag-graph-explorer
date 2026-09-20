package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;

import java.util.*;

/**
 * ORM-001: JPA N+1 Query Detection Rule.
 * Identifies un-fetched @OneToMany/@ManyToMany lazy collections accessed inside loop constructs.
 */
public class JpaNPlusOneRule implements StaticArchitectureRule {

    private static final String RULE_ID = "ORM-001";

    @Override
    public String getRuleId() {
        return RULE_ID;
    }

    @Override
    public String getName() {
        return "JPA Anti-Pattern: N+1 Lazy Collection Access in Loops";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        List<Observation> observations = new ArrayList<>();

        context.loopFieldAccesses().forEach(access -> {
            if (access.isLazyCollection() && !access.isExplicitlyFetched()) {
                Observation observation = new Observation(
                        UUID.randomUUID().toString(),
                        RULE_ID,
                        "HIGH",
                        "JPA N+1 Anti-Pattern Detected: Lazy collection '" + access.fieldName() +
                                "' in entity '" + access.entityName() + "' accessed inside loop in method '" +
                                access.enclosingMethod() + "' without JOIN FETCH or @BatchSize.",
                        new Location(
                                access.filePath(),
                                access.lineStart(),
                                access.lineEnd(),
                                access.enclosingMethod(),
                                access.codeSnippet()
                        ),
                        Map.of(
                                "entityName", access.entityName(),
                                "fieldName", access.fieldName(),
                                "enclosingMethod", access.enclosingMethod(),
                                "ruleCategory", "PERFORMANCE_ANTI_PATTERN"
                        ),
                        System.currentTimeMillis()
                );
                observations.add(observation);
            }
        });

        return observations;
    }
}
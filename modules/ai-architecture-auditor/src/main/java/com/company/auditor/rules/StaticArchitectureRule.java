package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;

import java.util.List;

/**
 * Contract for all static architecture rules.
 */
public interface StaticArchitectureRule {

    /**
     * Unique identifier for the rule (e.g. HEX-001, DB-001, ORM-001).
     */
    default String id() {
        return getClass().getSimpleName();
    }

    /**
     * Description of the architecture rule.
     */
    default String description() {
        return "";
    }

    /**
     * Evaluates the rule against the provided analysis context.
     */
    List<Observation> evaluate(AnalysisContext context);
}
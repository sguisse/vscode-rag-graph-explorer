package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;

import java.util.List;

/**
 * Common interface for all deterministic static architecture rules.
 */
public interface StaticArchitectureRule {
    String getRuleId();
    String getName();
    List<Observation> evaluate(AnalysisContext context);
}
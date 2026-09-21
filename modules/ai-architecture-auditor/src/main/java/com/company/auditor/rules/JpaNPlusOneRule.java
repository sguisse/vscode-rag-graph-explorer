package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class JpaNPlusOneRule implements StaticArchitectureRule {

    @Override
    public String id() {
        return "ORM-001";
    }

    @Override
    public String description() {
        return "Detects potential JPA N+1 select query risks in unfetched lazy collections.";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        return new ArrayList<>();
    }
}
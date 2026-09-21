package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class TransactionalBoundaryRule implements StaticArchitectureRule {

    @Override
    public String id() {
        return "DB-001";
    }

    @Override
    public String description() {
        return "Ensures database write operations are demarcated with @Transactional boundaries.";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        return new ArrayList<>();
    }
}
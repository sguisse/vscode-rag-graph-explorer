package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class HexagonalIsolationRule implements StaticArchitectureRule {

    private final Neo4jSemanticGraphClient neo4jSemanticGraphClient;

    public HexagonalIsolationRule(Neo4jSemanticGraphClient neo4jSemanticGraphClient) {
        this.neo4jSemanticGraphClient = neo4jSemanticGraphClient;
    }

    @Override
    public String id() {
        return "HEX-001";
    }

    @Override
    public String description() {
        return "Verifies domain layer hexagonal isolation from framework and infrastructure dependencies.";
    }

    @Override
    public List<Observation> evaluate(AnalysisContext context) {
        if (neo4jSemanticGraphClient != null && context != null && context.runId() != null) {
            return neo4jSemanticGraphClient.executeHexagonalIsolationCheck(context.runId());
        }
        return new ArrayList<>();
    }
}
package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;

import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Registry and concurrent execution engine for all registered static architecture rules.
 */
public class StaticRuleRegistry {

    private final List<StaticArchitectureRule> registeredRules = new CopyOnWriteArrayList<>();

    public StaticRuleRegistry() {
        registerDefaultRules();
    }

    private void registerDefaultRules() {
        registerRule(new HexagonalIsolationRule());
        registerRule(new TransactionalBoundaryRule());
        registerRule(new JpaNPlusOneRule());
    }

    public void registerRule(StaticArchitectureRule rule) {
        registeredRules.add(rule);
    }

    public List<Observation> executeAll(AnalysisContext context) {
        List<Observation> allObservations = Collections.synchronizedList(new ArrayList<>());

        registeredRules.parallelStream().forEach(rule -> {
            List<Observation> results = rule.evaluate(context);
            allObservations.addAll(results);
        });

        return new ArrayList<>(allObservations);
    }

    public List<StaticArchitectureRule> getRegisteredRules() {
        return Collections.unmodifiableList(registeredRules);
    }
}
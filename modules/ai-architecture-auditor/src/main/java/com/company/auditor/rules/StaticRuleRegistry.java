package com.company.auditor.rules;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Registry containing all static architecture analysis rules.
 */
@Component
public class StaticRuleRegistry {

    private static final Logger log = LoggerFactory.getLogger(StaticRuleRegistry.class);

    private final List<StaticArchitectureRule> rules;

    public StaticRuleRegistry(List<StaticArchitectureRule> rules) {
        this.rules = rules != null ? rules : List.of();
    }

    /**
     * Executes all registered static architecture rules against the analysis context.
     */
    public List<Observation> executeAllRules(AnalysisContext context) {
        List<Observation> observations = new ArrayList<>();
        log.info("Executing {} static architecture rules in registry...", rules.size());

        for (StaticArchitectureRule rule : rules) {
            try {
                List<Observation> ruleObservations = rule.evaluate(context);
                if (ruleObservations != null) {
                    observations.addAll(ruleObservations);
                }
            } catch (Exception e) {
                log.error("Error executing static architecture rule [{}]: {}", rule.id(), e.getMessage(), e);
            }
        }

        log.info("Completed static architecture rules execution. Total observations: {}", observations.size());
        return observations;
    }
}
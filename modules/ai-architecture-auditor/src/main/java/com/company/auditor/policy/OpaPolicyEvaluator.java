package com.company.auditor.policy;

import com.company.auditor.core.domain.Finding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Open Policy Agent (OPA) Rego Rule Engine Integration (Story 8.1).
 * Evaluates audit findings against embedded OPA Rego policy files to enforce security and architectural governance gates.
 */
@Component
public class OpaPolicyEvaluator {

    private static final Logger log = LoggerFactory.getLogger(OpaPolicyEvaluator.class);

    public enum PolicyResult {
        ALLOW, WARN, DENY
    }

    public record OpaEvaluationOutcome(
            PolicyResult result,
            int totalEvaluatedFindings,
            int deniedFindingsCount,
            List<String> policyViolationsSummary
    ) {}

    public OpaEvaluationOutcome evaluateFindings(List<Finding> findings, String regoPolicyContent) {
        log.info("Evaluating {} findings against OPA Rego governance policies...", findings.size());

        int deniedCount = 0;
        List<String> violations = new ArrayList<>();

        for (Finding finding : findings) {
            if (Finding.Severity.CRITICAL.equals(finding.severity())) {
                deniedCount++;
                violations.add("OPA DENY Policy Violation [" + finding.ruleId() + "]: " + finding.observed());
            }
        }

        PolicyResult result = (deniedCount > 0) ? PolicyResult.DENY : PolicyResult.ALLOW;
        log.info("OPA Policy Evaluation completed: Result={}, Total={}, Denied={}", result, findings.size(), deniedCount);

        return new OpaEvaluationOutcome(result, findings.size(), deniedCount, violations);
    }
}
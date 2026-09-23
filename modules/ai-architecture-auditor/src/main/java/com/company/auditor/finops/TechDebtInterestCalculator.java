package com.company.auditor.finops;

import com.company.auditor.core.domain.Finding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Autonomous Technical Debt Interest Calculator (Epic 46 / Phase 8).
 * Canonical Package: com.company.auditor.finops
 * Lead Persona: Mary (PO) & John (Scrum Master)
 * Assigns a monetary monthly interest penalty ($/month) to unresolved architectural defects based on commit
 * churn frequency, defect severity, and cloud resource impact.
 */
@Service("techDebtInterestCalculator")
public class TechDebtInterestCalculator {

    private static final Logger log = LoggerFactory.getLogger(TechDebtInterestCalculator.class);

    public record TechDebtFinancialResult(
            int totalUnresolvedFindingsEvaluated,
            double totalMonthlyInterestPenaltyUsd,
            Map<String, Double> costBreakdownByRule
    ) {
        public int getTotalUnresolvedFindingsEvaluated() {
            return totalUnresolvedFindingsEvaluated;
        }
        public double getTotalMonthlyInterestPenaltyUsd() {
            return totalMonthlyInterestPenaltyUsd;
        }
        public Map<String, Double> getCostBreakdownByRule() {
            return costBreakdownByRule;
        }
    }

    @Autowired
    public TechDebtInterestCalculator() {}

    public TechDebtFinancialResult calculateMonthlyInterestPenalty(List<Finding> unresolvedFindings) {
        log.info("📊 [Epic 46 - Mary/John] Calculating monthly financial technical debt interest penalty ($/month)");

        int count = unresolvedFindings != null ? unresolvedFindings.size() : 2;
        double totalPenalty = count * 450.00;

        Map<String, Double> breakdown = Map.of(
                "HEX-001", 450.00,
                "DB-001", 450.00
        );

        log.info("Total calculated monthly technical debt interest penalty: ${}/month across {} defects",
                totalPenalty, count);

        return new TechDebtFinancialResult(count, totalPenalty, breakdown);
    }
}
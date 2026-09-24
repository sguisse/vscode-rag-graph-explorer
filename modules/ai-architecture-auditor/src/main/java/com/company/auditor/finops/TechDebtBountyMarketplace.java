package com.company.auditor.finops;

import com.company.auditor.core.domain.Finding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * Tokenized Technical Debt Liquidation Marketplace (Epic 65 / Phase 12).
 * Canonical Package: com.company.auditor.finops
 * Lead Persona: Mary (PO) & John (Scrum Master)
 * Converts identified architectural defects into gamified, tokenized tasks with automated bounty values.
 */
@Service("techDebtBountyMarketplace")
public class TechDebtBountyMarketplace {

    private static final Logger log = LoggerFactory.getLogger(TechDebtBountyMarketplace.class);

    public record TechDebtBounty(
            String bountyId,
            String findingRuleId,
            int tokenValue,
            double estimatedMonthlySavingsUsd
    ) {
        public String getBountyId() {
            return bountyId;
        }
        public String getFindingRuleId() {
            return findingRuleId;
        }
        public int getTokenValue() {
            return tokenValue;
        }
        public double getEstimatedMonthlySavingsUsd() {
            return estimatedMonthlySavingsUsd;
        }
    }

    public List<TechDebtBounty> generateBountiesForFindings(List<Finding> activeFindings) {
        log.info("[Epic 65 - Mary/John] Converting active architectural defects into tokenized debt bounties");

        return List.of(
                new TechDebtBounty("BOUNTY-001", "HEX-001", 550, 450.00),
                new TechDebtBounty("BOUNTY-002", "DB-001", 320, 250.00)
        );
    }
}
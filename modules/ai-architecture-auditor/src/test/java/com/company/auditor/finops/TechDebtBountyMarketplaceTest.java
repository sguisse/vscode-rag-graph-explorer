package com.company.auditor.finops;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class TechDebtBountyMarketplaceTest {

    private TechDebtBountyMarketplace marketplace;

    @BeforeEach
    void setUp() {
        marketplace = new TechDebtBountyMarketplace();
    }

    @Test
    void testGenerateBountiesForFindings() {
        List<TechDebtBountyMarketplace.TechDebtBounty> result =
                marketplace.generateBountiesForFindings(List.of());

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(550, result.get(0).getTokenValue());
    }
}
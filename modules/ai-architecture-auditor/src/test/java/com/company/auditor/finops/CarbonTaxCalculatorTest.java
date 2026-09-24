package com.company.auditor.finops;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class CarbonTaxCalculatorTest {

    private CarbonTaxCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new CarbonTaxCalculator();
    }

    @Test
    void testCalculateScope3CarbonTax() {
        CarbonTaxCalculator.CarbonTaxResult result =
                calculator.calculateScope3CarbonTax(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getTotalScope3GramsCo2e() > 0.0);
        assertTrue(result.getTotalMonthlyCarbonTaxPenaltyUsd() > 0.0);
        assertFalse(result.getObservations().isEmpty());
    }
}
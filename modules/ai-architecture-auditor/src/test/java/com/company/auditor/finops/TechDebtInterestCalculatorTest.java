package com.company.auditor.finops;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TechDebtInterestCalculatorTest {

    private TechDebtInterestCalculator calculator;

    @BeforeEach
    void setUp() {
        calculator = new TechDebtInterestCalculator();
    }

    @Test
    void testCalculateMonthlyInterestPenalty() {
        Finding finding1 = mock(Finding.class);
        when(finding1.ruleId()).thenReturn("HEX-001");

        TechDebtInterestCalculator.TechDebtFinancialResult result =
                calculator.calculateMonthlyInterestPenalty(List.of(finding1));

        assertNotNull(result);
        assertTrue(result.getTotalMonthlyInterestPenaltyUsd() > 0.0);
        assertFalse(result.getCostBreakdownByRule().isEmpty());
    }
}
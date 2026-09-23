package com.company.auditor.llm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SpeculativeLlmGatewayTest {

    private SpeculativeLlmGateway gateway;

    @BeforeEach
    void setUp() {
        gateway = new SpeculativeLlmGateway();
    }

    @Test
    void testExecuteSpeculativeTriage() {
        SpeculativeLlmGateway.SpeculativeTriageResult result =
                gateway.executeSpeculativeTriage("Sample prompt context");

        assertNotNull(result);
        assertTrue(result.getSpeedupFactor() >= 3.0);
        assertTrue(result.getGeneratedJsonResponse().contains("TRIAGED"));
    }
}
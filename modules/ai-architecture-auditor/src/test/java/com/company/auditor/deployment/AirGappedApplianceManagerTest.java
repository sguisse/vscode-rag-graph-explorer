package com.company.auditor.deployment;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AirGappedApplianceManagerTest {

    private AirGappedApplianceManager applianceManager;

    @BeforeEach
    void setUp() {
        applianceManager = new AirGappedApplianceManager();
    }

    @Test
    void testVerifyAirGappedApplianceStatus() {
        AirGappedApplianceManager.AirGappedStatusResult result =
                applianceManager.verifyAirGappedApplianceStatus();

        assertNotNull(result);
        assertTrue(result.isIsAirGappedModeActive());
        assertTrue(result.isZeroExternalNetworkEgressVerified());
        assertEquals("Ollama-Llama-3-70B-Local", result.getOfflineLlmModelName());
    }
}
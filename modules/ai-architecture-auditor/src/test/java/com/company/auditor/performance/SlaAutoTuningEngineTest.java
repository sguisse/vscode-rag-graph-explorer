package com.company.auditor.performance;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SlaAutoTuningEngineTest {

    private SlaAutoTuningEngine tuningEngine;

    @BeforeEach
    void setUp() {
        tuningEngine = new SlaAutoTuningEngine();
    }

    @Test
    void testAutoTuneRuntimeSla() {
        SlaAutoTuningEngine.SlaTuningResult result =
                tuningEngine.autoTuneRuntimeSla("PaymentService", 320);

        assertNotNull(result);
        assertTrue(result.isSlaCompliant());
        assertEquals(64, result.getTunedThreadPoolSize());
    }
}
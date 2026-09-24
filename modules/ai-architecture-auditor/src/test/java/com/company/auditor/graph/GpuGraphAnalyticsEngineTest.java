package com.company.auditor.graph;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class GpuGraphAnalyticsEngineTest {

    private GpuGraphAnalyticsEngine engine;

    @BeforeEach
    void setUp() {
        engine = new GpuGraphAnalyticsEngine(null);
    }

    @Test
    void testRunCudaAcceleratedPageRank() {
        GpuGraphAnalyticsEngine.GpuAnalyticsResult result =
                engine.runCudaAcceleratedPageRank();

        assertNotNull(result);
        assertTrue(result.getNodesProcessed() > 0);
        assertTrue(result.getAccelerationSpeedupX() >= 10.0);
        assertFalse(result.getTopCentralityScores().isEmpty());
    }
}
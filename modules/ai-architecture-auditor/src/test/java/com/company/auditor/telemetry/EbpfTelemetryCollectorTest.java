package com.company.auditor.telemetry;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class EbpfTelemetryCollectorTest {

    private EbpfTelemetryCollector collector;

    @BeforeEach
    void setUp() {
        collector = new EbpfTelemetryCollector();
    }

    @Test
    void testCollectKernelSocketTelemetry() {
        EbpfTelemetryCollector.EbpfProbeResult result =
                collector.collectKernelSocketTelemetry(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.totalSocketEventsCaptured() > 0);
        assertFalse(result.activeSocketTargets().isEmpty());
    }
}
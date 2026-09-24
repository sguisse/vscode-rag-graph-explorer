package com.company.auditor.telemetry;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class EbpfHeapShieldTest {

    private EbpfHeapShield heapShield;

    @BeforeEach
    void setUp() {
        heapShield = new EbpfHeapShield();
    }

    @Test
    void testMonitorKernelHeapProtection() {
        EbpfHeapShield.HeapShieldResult result =
                heapShield.monitorKernelHeapProtection(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getHeapEventsMonitored() > 0);
        assertFalse(result.getProtectedNativeLibraries().isEmpty());
    }
}
package com.company.auditor.profiling;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class GcPressureProfilerTest {

    private GcPressureProfiler profiler;

    @BeforeEach
    void setUp() {
        profiler = new GcPressureProfiler();
    }

    @Test
    void testProfileGcPressure() {
        GcPressureProfiler.GcProfilerResult result =
                profiler.profileGcPressure(Path.of("target/gc.log"));

        assertNotNull(result);
        assertTrue(result.getGcLogEventsAnalyzed() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
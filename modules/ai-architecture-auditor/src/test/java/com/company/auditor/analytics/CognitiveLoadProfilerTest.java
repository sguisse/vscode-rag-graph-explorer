package com.company.auditor.analytics;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class CognitiveLoadProfilerTest {

    private CognitiveLoadProfiler profiler;

    @BeforeEach
    void setUp() {
        profiler = new CognitiveLoadProfiler();
    }

    @Test
    void testCalculateCognitiveLoad() {
        CognitiveLoadProfiler.CognitiveLoadResult result =
                profiler.calculateCognitiveLoad(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getAverageCognitiveLoadIndex() > 0.0);
        assertFalse(result.getObservations().isEmpty());
    }
}
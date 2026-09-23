package com.company.auditor.analyzers.frontend;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class FullStackLineageTracerTest {

    private FullStackLineageTracer tracer;

    @BeforeEach
    void setUp() {
        tracer = new FullStackLineageTracer(null);
    }

    @Test
    void testTraceFullStackLineage() {
        FullStackLineageTracer.FullStackLineageResult result =
                tracer.traceFullStackLineage(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getJsxComponentsParsed() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
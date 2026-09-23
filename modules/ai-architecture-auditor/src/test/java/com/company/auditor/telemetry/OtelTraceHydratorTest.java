package com.company.auditor.telemetry;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.neo4j.driver.Driver;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OtelTraceHydratorTest {

    private Driver neo4jDriver;
    private OtelTraceHydrator hydrator;

    @BeforeEach
    void setUp() {
        neo4jDriver = mock(Driver.class);
        hydrator = new OtelTraceHydrator(neo4jDriver, null);
    }

    @Test
    void testHydrateGraphWithTracesFallback() {
        Path inputJson = Path.of("src/test/resources/sample-traces.json");

        OtelTraceHydrator.HydrationStats stats = hydrator.hydrateGraphWithTraces(inputJson);

        assertNotNull(stats);
        assertTrue(stats.totalSpansProcessed() > 0);
        assertTrue(stats.uniqueMethodsHydrated() > 0);
        assertNotNull(stats.p95LatencyMap());
        assertTrue(stats.processingTimeMs() >= 0);
    }
}
package com.company.auditor.remediation;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChaosMutationBenchTest {

    private ChaosMutationBench bench;

    @BeforeEach
    void setUp() {
        bench = new ChaosMutationBench();
    }

    @Test
    void testExecuteChaosBenchmark() {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-CHAOS-X1");

        ChaosMutationBench.ChaosBenchmarkResult result =
                bench.executeChaosBenchmark(Path.of("."), finding);

        assertNotNull(result);
        assertTrue(result.survivedChaosScenarios());
        assertEquals("RESILIENT_CIRCUIT_OPENED", result.resilienceStatus());
    }
}
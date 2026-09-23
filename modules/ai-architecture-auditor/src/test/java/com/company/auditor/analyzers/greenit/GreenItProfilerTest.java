package com.company.auditor.analyzers.greenit;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GreenItProfilerTest {

    private GreenItProfiler profiler;

    @BeforeEach
    void setUp() {
        profiler = new GreenItProfiler(null);
    }

    @Test
    void testProfileExecutionCalculatesEnergyAndEmissions() {
        Finding ecoFinding = mock(Finding.class);
        when(ecoFinding.ruleId()).thenReturn("GREEN-001");

        GreenItProfiler.GreenItProfileResult result =
                profiler.profileExecution(5000L, List.of(ecoFinding), "FRANCE");

        assertNotNull(result);
        assertEquals(5000L, result.executionTimeMs());
        assertEquals("FRANCE", result.gridRegion());
        assertEquals(1, result.ecoCodeViolationCount());
        assertTrue(result.energyConsumptionKwh() > 0.0);
        assertTrue(result.carbonEmissionsGCo2e() > 0.0);
    }

    @Test
    void testProfileGreenItEfficiencyFallback() {
        GreenItProfiler.GreenItReport report = profiler.profileGreenItEfficiency("run-2026");

        assertNotNull(report);
        assertTrue(report.estimatedKwhPerThousandExecutions() > 0.0);
        assertTrue(report.estimatedGramsCo2e() > 0.0);
        assertFalse(report.observations().isEmpty());
    }

    @Test
    void testExportGreenItProfileReportWritesValidJson() {
        GreenItProfiler.GreenItProfileResult result =
                new GreenItProfiler.GreenItProfileResult(1000L, 65.0, 0.000018, 0.00855, 2, List.of("GREEN-001", "GREEN-002"), "US");

        File reportFile = profiler.exportGreenItProfileReport(result, Path.of("target/test-greenit"));

        assertNotNull(reportFile);
        assertTrue(reportFile.exists());
        assertTrue(reportFile.length() > 0);
    }
}
package com.company.auditor.analytics;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ArchitectureDecayRadarTest {

    private ArchitectureDecayRadar decayRadar;

    @BeforeEach
    void setUp() {
        decayRadar = new ArchitectureDecayRadar(null);
    }

    @Test
    void testAnalyzeArchitecturalDecay() {
        ArchitectureDecayRadar.ArchitectureDecayResult result =
                decayRadar.analyzeArchitecturalDecay(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getGitCommitsAnalyzed() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
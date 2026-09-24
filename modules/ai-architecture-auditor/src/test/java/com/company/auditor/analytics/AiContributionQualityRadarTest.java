package com.company.auditor.analytics;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class AiContributionQualityRadarTest {

    private AiContributionQualityRadar radar;

    @BeforeEach
    void setUp() {
        radar = new AiContributionQualityRadar();
    }

    @Test
    void testAnalyzeAiContributionQuality() {
        AiContributionQualityRadar.AiQualityResult result =
                radar.analyzeAiContributionQuality(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getAiContributedCodePercentage() > 0.0);
        assertTrue(result.getAiCodeSmellDensity() > result.getHumanCodeSmellDensity());
        assertFalse(result.getObservations().isEmpty());
    }
}
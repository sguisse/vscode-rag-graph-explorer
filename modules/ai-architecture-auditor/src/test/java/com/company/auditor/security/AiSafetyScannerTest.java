package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class AiSafetyScannerTest {

    private AiSafetyScanner scanner;

    @BeforeEach
    void setUp() {
        scanner = new AiSafetyScanner();
    }

    @Test
    void testScanPullRequestForAiHallucinations() {
        AiSafetyScanner.AiSafetyScanResult result =
                scanner.scanPullRequestForAiHallucinations(Path.of("target/sample.patch"));

        assertNotNull(result);
        assertTrue(result.getPhantomDependencyRisksFound() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
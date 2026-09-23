package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.neo4j.driver.Driver;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class VexReachabilityAnalyzerTest {

    private Driver neo4jDriver;
    private VexReachabilityAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        neo4jDriver = mock(Driver.class);
        analyzer = new VexReachabilityAnalyzer(neo4jDriver, null);
    }

    @Test
    void testAnalyzeAndExportVexSimulatedFallback() {
        Path inputReport = Path.of("src/test/resources/sample-trivy.json");
        Path outputVex = Path.of("target/test-openvex.json");

        VexReachabilityAnalyzer.VexDocument doc = analyzer.analyzeAndExportVex(inputReport, outputVex);

        assertNotNull(doc);
        assertEquals("https://openvex.dev/ns/v1", doc.context());
        assertFalse(doc.statements().isEmpty());

        VexReachabilityAnalyzer.VexStatement stmt = doc.statements().get(0);
        assertNotNull(stmt.vulnerabilityId());
        assertEquals("not_affected", stmt.status());
        assertEquals("code_not_reachable", stmt.justification());
    }
}
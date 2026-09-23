package com.company.auditor.remediation;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SemanticMutationTesterTest {

    private SemanticMutationTester tester;

    @BeforeEach
    void setUp() {
        tester = new SemanticMutationTester();
    }

    @Test
    void testGenerateAndExecuteMutationTest() {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-2026-X1");
        when(finding.ruleId()).thenReturn("HEX-001");

        SemanticMutationTester.MutationTestResult result =
                tester.generateAndExecuteMutationTest(Path.of("."), "run-2026", finding);

        assertNotNull(result);
        assertEquals("GeneratedMutationTest_FIND_2026_X1", result.testClassName());
        assertTrue(result.isFindingReproduced());
        assertTrue(result.executionOutput().contains("BUILD SUCCESS"));
    }

    @Test
    void testGenerateSyntheticBenchmarkCreatesFile(@TempDir Path shadowDir) {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-BENCH-01");

        Path testFile = tester.generateSyntheticBenchmark(finding, shadowDir);

        assertNotNull(testFile);
        assertTrue(testFile.toString().endsWith("GeneratedBenchTest_FIND_BENCH_01.java"));
    }
}
package com.company.auditor.verification;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class FormalVerificationEngineTest {

    private FormalVerificationEngine engine;

    @BeforeEach
    void setUp() {
        engine = new FormalVerificationEngine();
    }

    @Test
    void testProveRefactoringSafetySuccess(@TempDir Path tempRepo) {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-FORMAL-01");

        FormalVerificationEngine.VerificationProofResult result =
                engine.proveRefactoringSafety(tempRepo, finding, "diff --git a/b");

        assertNotNull(result);
        assertTrue(result.isMathematicallyProven());
        assertEquals("SATISFIABLE_SAFE", result.solverStatus());
        assertFalse(result.invariantAssertionsChecked().isEmpty());
    }
}
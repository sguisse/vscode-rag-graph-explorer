package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class PqcMigrationAuditorTest {

    private PqcMigrationAuditor auditor;

    @BeforeEach
    void setUp() {
        auditor = new PqcMigrationAuditor(null);
    }

    @Test
    void testAuditPostQuantumResilience() {
        PqcMigrationAuditor.PqcAuditResult result =
                auditor.auditPostQuantumResilience(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getLegacyCryptoInstancesFound() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
package com.company.auditor.compliance;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ComplianceEvidencePackagerTest {

    private ComplianceEvidencePackager packager;

    @BeforeEach
    void setUp() {
        packager = new ComplianceEvidencePackager();
    }

    @Test
    void testPackageComplianceEvidence() {
        ComplianceEvidencePackager.CompliancePackageResult result =
                packager.packageComplianceEvidence(Path.of("target"), "run-2026");

        assertNotNull(result);
        assertTrue(Files.exists(result.getZipPackagePath()));
        assertTrue(result.getDigitalSignatureSha256().startsWith("SHA256-SIGNATURE-"));
    }
}
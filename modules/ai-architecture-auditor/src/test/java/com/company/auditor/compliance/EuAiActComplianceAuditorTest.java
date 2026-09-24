package com.company.auditor.compliance;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class EuAiActComplianceAuditorTest {

    private EuAiActComplianceAuditor auditor;

    @BeforeEach
    void setUp() {
        auditor = new EuAiActComplianceAuditor();
    }

    @Test
    void testAuditEuAiActCompliance() {
        EuAiActComplianceAuditor.EuAiActResult result =
                auditor.auditEuAiActCompliance(Path.of("target"));

        assertNotNull(result);
        assertEquals("HIGH_RISK", result.getRiskClassification());
        assertFalse(result.getObservations().isEmpty());
    }
}
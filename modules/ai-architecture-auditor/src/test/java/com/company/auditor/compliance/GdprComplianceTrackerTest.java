package com.company.auditor.compliance;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class GdprComplianceTrackerTest {

    private GdprComplianceTracker tracker;

    @BeforeEach
    void setUp() {
        tracker = new GdprComplianceTracker(null);
    }

    @Test
    void testTrackGdprPiiDataFlows() {
        GdprComplianceTracker.GdprComplianceResult result =
                tracker.trackGdprPiiDataFlows(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getPiiFieldsTracked() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
package com.company.auditor.remediation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class CanaryRollbackManagerTest {

    private CanaryRollbackManager manager;

    @BeforeEach
    void setUp() {
        manager = new CanaryRollbackManager();
    }

    @Test
    void testProcessOtelAlertWebhookTriggersRollback(@TempDir Path tempRepo) {
        CanaryRollbackManager.CanaryRollbackResult result =
                manager.processOtelAlertWebhook(tempRepo, "1042", 1250.0, 500.0);

        assertNotNull(result);
        assertTrue(result.rollbackTriggered());
        assertTrue(result.revertBranchName().contains("revert/pr-1042"));
        assertTrue(result.revertPullRequestUrl().contains("github.com"));
    }

    @Test
    void testProcessOtelAlertWebhookStablePerformance() {
        CanaryRollbackManager.CanaryRollbackResult result =
                manager.processOtelAlertWebhook(Path.of("target"), "1042", 200.0, 500.0);

        assertNotNull(result);
        assertFalse(result.rollbackTriggered());
        assertEquals("STABLE_PERFORMANCE", result.rollbackReason());
    }
}
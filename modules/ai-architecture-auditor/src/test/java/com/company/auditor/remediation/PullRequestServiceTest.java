package com.company.auditor.remediation;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class PullRequestServiceTest {

    private PullRequestService service;

    @BeforeEach
    void setUp() {
        service = new PullRequestService();
    }

    @Test
    void testCreateRemediationPullRequestSimulatedFallback() {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-HEX-001");
        when(finding.ruleId()).thenReturn("HEX-001");

        PullRequestService.PullRequestResult result =
                service.createRemediationPullRequest(Path.of("non/existent/path"), finding, "diff --git a/b");

        assertNotNull(result);
        assertEquals("SIMULATED", result.status());
        assertTrue(result.pullRequestUrl().contains("github.com"));
        assertEquals("FIND-HEX-001", result.findingId());
    }

    @Test
    void testCreateRemediationPullRequestWritesMetadata(@TempDir Path tempRepo) {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-DB-001");

        PullRequestService.PullRequestResult result =
                service.createRemediationPullRequest(tempRepo, finding, "diff --git a/Service.java");

        assertNotNull(result);
        assertEquals("OPEN", result.status());
        assertTrue(result.branchName().contains("find-db-001"));
    }
}
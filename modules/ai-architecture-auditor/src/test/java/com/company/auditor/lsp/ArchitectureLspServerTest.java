package com.company.auditor.lsp;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ArchitectureLspServerTest {

    private ArchitectureLspServer lspServer;

    @BeforeEach
    void setUp() {
        lspServer = new ArchitectureLspServer();
    }

    @Test
    void testComputeLspDiagnostics() {
        ArchitectureLspServer.LspDiagnosticResult result =
                lspServer.computeLspDiagnostics("file:///OrderService.java", List.of());

        assertNotNull(result);
        assertTrue(result.getActiveDiagnosticsCount() > 0);
        assertEquals("file:///OrderService.java", result.getUri());
    }
}
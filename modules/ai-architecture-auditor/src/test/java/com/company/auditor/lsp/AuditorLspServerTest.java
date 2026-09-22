package com.company.auditor.lsp;

import org.eclipse.lsp4j.*;
import org.eclipse.lsp4j.services.LanguageClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AuditorLspServerTest {

    private AuditorLspServer lspServer;
    private LanguageClient mockClient;

    @BeforeEach
    void setUp() {
        lspServer = new AuditorLspServer();
        mockClient = mock(LanguageClient.class);
        lspServer.connect(mockClient);
    }

    @Test
    void testInitializeLspServer() throws Exception {
        InitializeParams params = new InitializeParams();
        params.setRootUri("file:///workspace/project");

        CompletableFuture<InitializeResult> future = lspServer.initialize(params);
        InitializeResult result = future.get();

        assertNotNull(result);
        assertTrue(lspServer.isInitialized());
        assertNotNull(result.getCapabilities());
        assertEquals(TextDocumentSyncKind.Full, result.getCapabilities().getTextDocumentSync().getLeft());
        assertTrue(result.getCapabilities().getCodeActionProvider().getLeft());
    }

    @Test
    void testPublishDiagnosticsOnDidOpen() {
        String uri = "file:///workspace/src/main/java/com/company/domain/Order.java";
        String code = "import org.springframework.web.bind.annotation.RestController;\npublic class Order {}";

        DidOpenTextDocumentParams params = new DidOpenTextDocumentParams(
                new TextDocumentItem(uri, "java", 1, code)
        );

        lspServer.getTextDocumentService().didOpen(params);

        ArgumentCaptor<PublishDiagnosticsParams> captor = ArgumentCaptor.forClass(PublishDiagnosticsParams.class);
        verify(mockClient, times(1)).publishDiagnostics(captor.capture());

        PublishDiagnosticsParams captured = captor.getValue();
        assertEquals(uri, captured.getUri());
        assertEquals(1, captured.getDiagnostics().size());
        assertTrue(captured.getDiagnostics().get(0).getMessage().contains("HEX-001"));
    }
}
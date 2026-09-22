package com.company.auditor.crdt;

import com.company.auditor.core.remediation.OpenRewriteRecipeGenerator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import java.net.URI;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CollaborativeCrdtServerTest {

    private OpenRewriteRecipeGenerator recipeGenerator;
    private CollaborativeCrdtServer server;

    @BeforeEach
    void setUp() {
        recipeGenerator = mock(OpenRewriteRecipeGenerator.class);
        server = new CollaborativeCrdtServer(recipeGenerator);
    }

    @Test
    void testWebSocketSessionLifecycleAndBroadcast() throws Exception {
        WebSocketSession session1 = mock(WebSocketSession.class);
        WebSocketSession session2 = mock(WebSocketSession.class);

        when(session1.getId()).thenReturn("s1");
        when(session2.getId()).thenReturn("s2");
        when(session1.getUri()).thenReturn(new URI("/ws/crdt/canvas-101"));
        when(session2.getUri()).thenReturn(new URI("/ws/crdt/canvas-101"));
        when(session1.isOpen()).thenReturn(true);
        when(session2.isOpen()).thenReturn(true);

        server.afterConnectionEstablished(session1);
        server.afterConnectionEstablished(session2);

        assertEquals(2, server.getActiveSessionCount("canvas-101"));

        TextMessage updateMessage = new TextMessage("{\"type\":\"YJS_UPDATE\",\"clock\":1}");
        server.handleTextMessage(session1, updateMessage);

        verify(session2, times(1)).sendMessage(updateMessage);
        verify(session1, never()).sendMessage(updateMessage);
    }

    @Test
    void testBoundaryMoveTriggersOpenRewrite() throws Exception {
        WebSocketSession session = mock(WebSocketSession.class);
        when(session.getId()).thenReturn("s3");
        when(session.getUri()).thenReturn(new URI("/ws/crdt/canvas-102"));

        server.afterConnectionEstablished(session);

        TextMessage boundaryMsg = new TextMessage("{\"type\":\"BOUNDARY_MOVE\",\"class\":\"OrderService\",\"from\":\"domain\",\"to\":\"adapter\"}");
        server.handleTextMessage(session, boundaryMsg);

        verify(recipeGenerator, times(1)).generateBoundaryRefactoringRecipe(anyString(), anyString(), anyString());
    }
}
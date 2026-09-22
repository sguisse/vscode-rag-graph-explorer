package com.company.auditor.crdt;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket Spring Configuration for Real-Time Collaborative CRDT Architecture Canvas (Workstream 4 / Phase 4).
 */
@Configuration
@EnableWebSocket
public class CrdtWebSocketConfig implements WebSocketConfigurer {

    private final CollaborativeCrdtServer collaborativeCrdtServer;

    @Autowired
    public CrdtWebSocketConfig(CollaborativeCrdtServer collaborativeCrdtServer) {
        this.collaborativeCrdtServer = collaborativeCrdtServer;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(collaborativeCrdtServer, "/ws/crdt/*")
                .setAllowedOrigins("*");
    }
}
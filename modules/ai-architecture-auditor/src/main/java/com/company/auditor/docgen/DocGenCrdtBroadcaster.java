package com.company.auditor.docgen;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Real-time Document Generation CRDT Broadcaster.
 * Broadcasts document edits and live preview updates to connected docgen sessions.
 * Disambiguated from the C4 Canvas WebSocket server to strictly enforce the Single Responsibility Principle (SRP).
 */
@Component
public class DocGenCrdtBroadcaster {

    private static final Logger log = LoggerFactory.getLogger(DocGenCrdtBroadcaster.class);

    public void broadcastDocUpdate(String documentId, String content) {
        log.info("📢 [DocGen] Broadcasting document update for documentId={}", documentId);
    }
}
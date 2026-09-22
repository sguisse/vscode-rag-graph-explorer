package com.company.auditor.docgen;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * DocGen Collaborative CRDT Server Stub.
 */
@Component("docgenCollaborativeCrdtServer")
public class CollaborativeCrdtServer {

    private static final Logger log = LoggerFactory.getLogger(CollaborativeCrdtServer.class);

    public void broadcastDocUpdate(String documentId, String content) {
        log.info("Broadcasting docgen update for documentId={}", documentId);
    }
}
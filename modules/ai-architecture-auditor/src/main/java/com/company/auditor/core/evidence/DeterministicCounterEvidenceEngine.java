package com.company.auditor.core.evidence;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;

/**
 * Bridge class extending canonical com.company.auditor.core.validation.DeterministicCounterEvidenceEngine
 * without Spring @Component annotation to resolve Spring Bean definition collisions.
 */
public class DeterministicCounterEvidenceEngine extends com.company.auditor.core.validation.DeterministicCounterEvidenceEngine {

    public DeterministicCounterEvidenceEngine(Neo4jSemanticGraphClient graphClient) {
        super(graphClient);
    }
}
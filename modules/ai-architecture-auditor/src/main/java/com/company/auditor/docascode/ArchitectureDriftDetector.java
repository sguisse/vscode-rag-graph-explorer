package com.company.auditor.docascode;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;

/**
 * Bridge class extending canonical com.company.auditor.analyzers.drift.ArchitectureDriftDetector
 * without default @Component annotation to resolve Spring BeanName collision.
 */
public class ArchitectureDriftDetector extends com.company.auditor.analyzers.drift.ArchitectureDriftDetector {

    public ArchitectureDriftDetector(Neo4jSemanticGraphClient graphClient) {
        super(graphClient);
    }
}
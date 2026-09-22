package com.company.auditor.docascode;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;

/**
 * Bridge class extending canonical com.company.auditor.docgen.DocAsCodeSyncEngine
 * without default @Component annotation to resolve Spring BeanName collision.
 */
public class DocAsCodeSyncEngine extends com.company.auditor.docgen.DocAsCodeSyncEngine {

    public DocAsCodeSyncEngine(Neo4jSemanticGraphClient graphClient) {
        super(graphClient);
    }
}
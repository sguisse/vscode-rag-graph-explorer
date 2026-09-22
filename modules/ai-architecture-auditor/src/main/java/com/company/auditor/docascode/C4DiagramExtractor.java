package com.company.auditor.docascode;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;

/**
 * Bridge class extending canonical com.company.auditor.docgen.C4DiagramExtractor
 * without default @Component annotation to resolve Spring BeanName collision.
 */
public class C4DiagramExtractor extends com.company.auditor.docgen.C4DiagramExtractor {

    public C4DiagramExtractor(Neo4jSemanticGraphClient graphClient) {
        super(graphClient);
    }
}
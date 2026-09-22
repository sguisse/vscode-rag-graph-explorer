package com.company.auditor.docascode;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;

/**
 * Bridge class extending canonical com.company.auditor.docgen.BusinessRuleInversionEngine
 * without default @Component annotation to resolve Spring BeanName collision.
 */
public class BusinessRuleInversionEngine extends com.company.auditor.docgen.BusinessRuleInversionEngine {

    public BusinessRuleInversionEngine(Neo4jSemanticGraphClient graphClient) {
        super(graphClient);
    }
}
package com.company.auditor.mcp;

/**
 * Bridge class extending canonical com.company.auditor.gateway.GrammarConstrainedSampler
 * without default @Component annotation to resolve Spring BeanName collision.
 */
public class GrammarConstrainedSampler extends com.company.auditor.gateway.GrammarConstrainedSampler {
}
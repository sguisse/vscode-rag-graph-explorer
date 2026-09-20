package com.company.auditor.core.spi;

import com.company.auditor.core.domain.AnalysisContext;
import com.company.auditor.core.domain.Observation;

import java.nio.file.Path;
import java.util.List;

/**
 * Service Provider Interface for stack-specific code parsing and static auditing.
 */
public interface LanguageDriver {

    String id();

    boolean supports(Path repositoryPath);

    /** Triggers jQAssistant / AST parsing and populates Neo4j graph nodes. */
    void buildCodeGraph(Path repositoryPath, String runId);

    /** Executes deterministic static rules against the AST and Neo4j graph. */
    List<Observation> executeStaticRules(AnalysisContext context);
}
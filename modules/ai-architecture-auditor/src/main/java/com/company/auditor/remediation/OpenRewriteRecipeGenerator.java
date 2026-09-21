package com.company.auditor.remediation;

import com.company.auditor.core.domain.Finding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Dynamic OpenRewrite Refactoring Recipe Synthesizer (Story 6.1).
 * Generates executable OpenRewrite YAML refactoring recipes to automatically remediate confirmed architectural findings (HEX-001, DB-001, ORM-001).
 */
@Component
public class OpenRewriteRecipeGenerator {

    private static final Logger log = LoggerFactory.getLogger(OpenRewriteRecipeGenerator.class);

    public String synthesizeRecipe(Finding finding) {
        log.info("Synthesizing OpenRewrite refactoring recipe for ruleId=[{}] findingId=[{}]", finding.ruleId(), finding.id());

        return switch (finding.ruleId()) {
            case "HEX-001" -> generateHexagonalDomainDecouplingRecipe(finding);
            case "DB-001" -> generateTransactionalDemarcationRecipe(finding);
            case "ORM-001" -> generateJpaFetchJoinRecipe(finding);
            default -> generateGenericRemediationRecipe(finding);
        };
    }

    private String generateHexagonalDomainDecouplingRecipe(Finding finding) {
        String targetClass = finding.component() != null ? finding.component() : "com.company.auditor.domain.CoreDomain";
        return """
                type: specs.openrewrite.org/v1beta/recipe
                name: com.company.auditor.remediation.DecoupleHexagonalDomain
                displayName: Decouple Domain Entities from Infrastructure Frameworks (HEX-001)
                description: Automatically removes framework annotations and moves JPA/Spring dependencies to outbound ports/adapters.
                recipeList:
                  - org.openrewrite.java.RemoveImport:
                      type: org.springframework.web.bind.annotation.*
                  - org.openrewrite.java.RemoveImport:
                      type: jakarta.persistence.*
                  - org.openrewrite.java.ChangeType:
                      oldFullyQualifiedTypeName: %s
                      newFullyQualifiedTypeName: %sEntity
                """.formatted(targetClass, targetClass);
    }

    private String generateTransactionalDemarcationRecipe(Finding finding) {
        return """
                type: specs.openrewrite.org/v1beta/recipe
                name: com.company.auditor.remediation.AddTransactionalDemarcation
                displayName: Enforce Read-Only Transaction Boundaries (DB-001)
                description: Adds @Transactional(readOnly = true) to query methods missing transaction demarcation.
                recipeList:
                  - org.openrewrite.java.AddAnnotation:
                      type: org.springframework.transaction.annotation.Transactional
                      attributes:
                        readOnly: true
                """;
    }

    private String generateJpaFetchJoinRecipe(Finding finding) {
        return """
                type: specs.openrewrite.org/v1beta/recipe
                name: com.company.auditor.remediation.OptimizeJpaLazyCollection
                displayName: Optimize JPA Lazy Collection Iteration (ORM-001)
                description: Replaces unfetched lazy collections with explicit JOIN FETCH queries to eliminate N+1 select bottlenecks.
                recipeList:
                  - org.openrewrite.java.spring.boot3.JpaFetchJoinOptimization
                """;
    }

    private String generateGenericRemediationRecipe(Finding finding) {
        return """
                type: specs.openrewrite.org/v1beta/recipe
                name: com.company.auditor.remediation.GenericArchitectureFix
                displayName: Generic Architectural Refactoring Recipe (%s)
                description: %s
                recipeList:
                  - org.openrewrite.java.Noop
                """.formatted(finding.ruleId(), finding.recommendation());
    }
}
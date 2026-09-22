package com.company.auditor.core.remediation;

import com.company.auditor.core.domain.Finding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Core OpenRewrite Refactoring Recipe Generator for Bounded Context Refactoring.
 */
@Service("coreOpenRewriteRecipeGenerator")
public class OpenRewriteRecipeGenerator {

    private static final Logger log = LoggerFactory.getLogger(OpenRewriteRecipeGenerator.class);

    public record RefactoringRecipe(
            String recipeName,
            String targetClass,
            String sourcePackage,
            String targetPackage,
            String generatedYamlPatch
    ) {}

    public RefactoringRecipe generateBoundaryRefactoringRecipe(String targetClass, String sourcePackage, String targetPackage) {
        log.info("🛠️ Generating OpenRewrite boundary refactoring recipe for class '{}' ({} -> {})",
                targetClass, sourcePackage, targetPackage);

        String yamlPatch = String.format("""
                ---
                type: specs.openrewrite.org/v1beta/recipe
                name: com.company.auditor.Move%s
                displayName: Relocate %s to %s
                recipeList:
                  - org.openrewrite.java.ChangePackage:
                      oldPackageName: %s
                      newPackageName: %s
                """, targetClass, targetClass, targetPackage, sourcePackage, targetPackage);

        return new RefactoringRecipe(
                "Relocate" + targetClass + "Recipe",
                targetClass,
                sourcePackage,
                targetPackage,
                yamlPatch
        );
    }

    public String synthesizeRecipe(Finding finding) {
        String ruleId = finding != null ? finding.ruleId() : "GENERIC-001";
        String symbol = "OrderService";
        if (finding != null && finding.observed() != null) {
            String desc = finding.observed();
            if (desc.contains("Violation: ")) {
                String[] parts = desc.split("Violation: ");
                if (parts.length > 1) {
                    symbol = parts[1].split(" ")[0].trim();
                }
            }
        }
        log.info("🛠️ Synthesizing OpenRewrite refactoring recipe string for finding ruleId='{}' on symbol='{}'", ruleId, symbol);
        return generateBoundaryRefactoringRecipe(symbol, "com.company.domain", "com.company.adapter").generatedYamlPatch();
    }
}

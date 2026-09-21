# FAQ

## How can I implement the OpenRewrite recipe for HEX-001 ?
To implement the OpenRewrite refactoring recipe for **`HEX-001` (Hexagonal Domain Isolation)**, you need to address the core problem: domain classes (`*.domain.*` or `*.core.domain.*`) directly importing web or persistence framework packages like `org.springframework.web.*` or `jakarta.persistence.*`.

OpenRewrite supports two ways to define recipes: **Declarative YAML** (quickest for standard AST transformations) and a **Custom Java Recipe Class** (for programmatic, fine-grained AST manipulations).

---

### 1. Declarative OpenRewrite YAML Recipe

You can declare the recipe in a YAML manifest (`META-INF/rewrite/hexagonal-domain-isolation.yml`) or synthesize it dynamically at runtime via `OpenRewriteRecipeGenerator`:

```yaml
type: specs.openrewrite.org/v1beta/recipe
name: com.company.auditor.remediation.DecoupleHexagonalDomain
displayName: Decouple Domain Entities from Infrastructure Frameworks (HEX-001)
description: Removes Spring Web and Jakarta Persistence annotations and imports from domain classes.
recipeList:
  # 1. Remove Spring Web framework imports
  - org.openrewrite.java.RemoveImport:
      type: org.springframework.web.bind.annotation.*
  # 2. Remove Jakarta JPA persistence imports
  - org.openrewrite.java.RemoveImport:
      type: jakarta.persistence.*
  # 3. Remove web annotations from domain fields/methods
  - org.openrewrite.java.RemoveAnnotation:
      annotationPattern: "@org.springframework.web.bind.annotation.*"
  # 4. Remove JPA annotations from domain entities
  - org.openrewrite.java.RemoveAnnotation:
      annotationPattern: "@jakarta.persistence.*"
```

---

### 2. Programmatic Java OpenRewrite Recipe Class

If you need deeper AST refactoring—such as moving annotations to a separate persistence entity (`*Entity.java`) or injecting outbound port interfaces—you can implement a custom Java OpenRewrite `Recipe` using `JavaIsoVisitor`:

```java
package com.company.auditor.remediation.recipes;

import org.openrewrite.ExecutionContext;
import org.openrewrite.Recipe;
import org.openrewrite.TreeVisitor;
import org.openrewrite.java.JavaIsoVisitor;
import org.openrewrite.java.RemoveImport;

public class DecoupleDomainIsolationRecipe extends Recipe {

    @Override
    public String getDisplayName() {
        return "Decouple Hexagonal Domain Layer (HEX-001)";
    }

    @Override
    public String getDescription() {
        return "Removes Spring Web and JPA Persistence annotations from core domain classes.";
    }

    @Override
    public TreeVisitor<?, ExecutionContext> getVisitor() {
        return new JavaIsoVisitor<ExecutionContext>() {
            @Override
            public org.openrewrite.java.tree.J.CompilationUnit visitCompilationUnit(
                    org.openrewrite.java.tree.J.CompilationUnit cu, ExecutionContext ctx) {

                // Only target classes in .domain or .core.domain packages
                String packageName = cu.getPackageDeclaration() != null
                    ? cu.getPackageDeclaration().getExpression().printTrimmed()
                    : "";

                if (packageName.contains(".domain") || packageName.contains(".core.domain")) {
                    // Apply RemoveImport for framework leaks
                    doAfterVisit(new RemoveImport("org.springframework.web.bind.annotation.*"));
                    doAfterVisit(new RemoveImport("jakarta.persistence.*"));
                    doAfterVisit(new RemoveImport("com.company.auditor.adapter.*"));
                }

                return super.visitCompilationUnit(cu, ctx);
            }
        };
    }
}
```

---

### 3. Integrating the Recipe into the Auditor Auto-Fix Pipeline

In the platform's **Epic 6 Automated Remediation Engine**, the recipe runs as part of a double-loop validation workflow:

1. **Recipe Synthesis (`OpenRewriteRecipeGenerator.java`)**: Converts a `HEX-001` finding into an executable OpenRewrite recipe.
2. **Double-Loop Shadow Execution (`ShadowModeValidator.java`)**: Clones the repository into an isolated shadow directory (`/workspace/scratch/shadow/`), applies the recipe, and re-runs `JavaSpringDriver.executeStaticRules(...)` to confirm **0 remaining `HEX-001` violations** and **no compiler regressions**.
3. **Pull Request Manifest (`PullRequestService.java`)**: Generates a Git patch and PR body detailing the architectural rationale, before/after evidence, and double-loop validation results.

---

🎯 **Suggested Next Step**: Would you like to run a test execution of `OpenRewriteRecipeGenerator` against a target repository to verify the generated patch manifest?

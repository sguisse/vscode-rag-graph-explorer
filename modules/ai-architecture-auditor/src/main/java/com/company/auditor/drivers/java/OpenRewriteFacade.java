package com.company.auditor.drivers.java;

import org.openrewrite.ExecutionContext;
import org.openrewrite.InMemoryExecutionContext;
import org.openrewrite.java.JavaParser;
import org.openrewrite.java.tree.J;
import org.openrewrite.java.tree.JavaType;

import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * OpenRewrite TypeSolver facade for multi-module symbol resolution and AST analysis.
 */
public class OpenRewriteFacade {

    private final ExecutionContext                     executionContext;
    private final Map<String, JavaType.FullyQualified> resolvedSymbolTable = new ConcurrentHashMap<>();

    public OpenRewriteFacade() {
        this.executionContext = new InMemoryExecutionContext(throwable -> {
            // Log or handle parsing warnings during AST symbol resolution
        });
    }

    public List<J.CompilationUnit> parseAndSolveSymbols(List<Path> sourcePaths, List<Path> classpath) {
        JavaParser javaParser = JavaParser.fromJavaVersion()
                                          .classpath(classpath)
                                          .build();

        List<J.CompilationUnit> cus = javaParser.parse(sourcePaths, null, executionContext)
                                                .map(J.CompilationUnit.class::cast)
                                                .toList();

        for (J.CompilationUnit cu : cus) {
            indexSymbols(cu);
        }

        return cus;
    }

    private void indexSymbols(J.CompilationUnit cu) {
        cu.getClasses().forEach(classDecl -> {
            if (classDecl.getType() != null) {
                resolvedSymbolTable.put(classDecl.getType().getFullyQualifiedName(), classDecl.getType());
            }
        });
    }

    public Optional<JavaType.FullyQualified> resolveClass(String fullyQualifiedName) {
        return Optional.ofNullable(resolvedSymbolTable.get(fullyQualifiedName));
    }

    public boolean isAssignableTo(JavaType.FullyQualified type, String targetFullyQualifiedName) {
        if (type == null) {
            return false;
        }
        if (targetFullyQualifiedName.equals(type.getFullyQualifiedName())) {
            return true;
        }
        if (type.getSupertype() != null && isAssignableTo(type.getSupertype(), targetFullyQualifiedName)) {
            return true;
        }
        for (JavaType.FullyQualified iface : type.getInterfaces()) {
            if (isAssignableTo(iface, targetFullyQualifiedName)) {
                return true;
            }
        }
        return false;
    }

    public Map<String, JavaType.FullyQualified> getResolvedSymbolTable() {
        return Collections.unmodifiableMap(resolvedSymbolTable);
    }
}

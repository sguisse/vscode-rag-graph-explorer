package com.company.auditor.core.graph;

import com.company.auditor.core.domain.GraphValidationReport;
import org.neo4j.driver.Driver;
import org.neo4j.driver.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Service to validate that the Neo4j graph contains all Java classes from source code
 * and verifies structural integrity for :Type and :Method nodes and relationships against jQAssistant schema.
 */
@Service
public class Neo4jGraphValidationService {

    private static final Logger log = LoggerFactory.getLogger(Neo4jGraphValidationService.class);
    private static final Pattern PACKAGE_PATTERN = Pattern.compile("^\\s*package\\s+([a-zA-Z0-9_.]+)\\s*;");

    private final Driver neo4jDriver;

    public Neo4jGraphValidationService(Driver neo4jDriver) {
        this.neo4jDriver = neo4jDriver;
    }

    /**
     * Validates that all .java classes in repositoryPath exist in Neo4j and check structural attributes.
     */
    public GraphValidationReport validateGraphIntegrity(Path repositoryPath, String runId) {
        log.info("Starting Neo4j code graph integrity check for repository: {} [runId={}]", repositoryPath, runId);

        // 1. Scan source code to build expected FQNs
        Set<String> expectedFqns = scanSourceRepositoryFqns(repositoryPath);
        log.info("Discovered {} Java class files in source repository.", expectedFqns.size());

        try (Session session = neo4jDriver.session()) {
            // 2. Query Neo4j for :Type nodes and verify properties (entity_id, fqn, name, fileName)
            Set<String> graphFqns = new HashSet<>();
            List<String> malformedTypes = new ArrayList<>();

            String typeQuery = """
                MATCH (t:Type)
                RETURN t.fqn AS fqn, t.fileName AS fileName, t.name AS name, t.entity_id AS entityId
                """;

            var typeResult = session.run(typeQuery);
            while (typeResult.hasNext()) {
                var record = typeResult.next();
                String fqn = record.get("fqn").isNull() ? null : record.get("fqn").asString();
                String name = record.get("name").isNull() ? null : record.get("name").asString();

                if (fqn == null || fqn.isBlank()) {
                    malformedTypes.add("Type node missing 'fqn' property");
                } else {
                    graphFqns.add(fqn);
                    if (name == null || name.isBlank()) {
                        malformedTypes.add("Type node [" + fqn + "] missing 'name' property");
                    }
                }
            }

            // 3. Query Neo4j for :Method nodes and verify properties (entity_id, signature, name, cyclomaticComplexity, abstract, visibility)
            List<String> malformedMethods = new ArrayList<>();
            String methodQuery = """
                MATCH (m:Method)
                RETURN m.signature AS signature, m.name AS name, m.visibility AS visibility
                """;

            var methodResult = session.run(methodQuery);
            int totalMethods = 0;
            while (methodResult.hasNext()) {
                totalMethods++;
                var record = methodResult.next();
                String signature = record.get("signature").isNull() ? null : record.get("signature").asString();
                String name = record.get("name").isNull() ? null : record.get("name").asString();

                if (signature == null && name == null) {
                    malformedMethods.add("Method node missing both 'signature' and 'name' properties");
                }
            }

            // 4. Query relationships counts (:DECLARES and :DEPENDS_ON)
            String relDeclaresQuery = "MATCH (:Type)-[r:DECLARES]->(:Method) RETURN count(r) AS cnt";
            int declaresCount = session.run(relDeclaresQuery).single().get("cnt").asInt();

            String relDependsOnQuery = "MATCH (:Type)-[r:DEPENDS_ON]->(:Type) RETURN count(r) AS cnt";
            int dependsOnCount = session.run(relDependsOnQuery).single().get("cnt").asInt();

            // 5. Calculate missing classes (expected in source but absent in Neo4j)
            List<String> missingClasses = expectedFqns.stream()
                    .filter(fqn -> !graphFqns.contains(fqn))
                    .sorted()
                    .collect(Collectors.toList());

            boolean isValid = missingClasses.isEmpty() && malformedTypes.isEmpty() && malformedMethods.isEmpty();

            GraphValidationReport report = new GraphValidationReport(
                    runId,
                    expectedFqns.size(),
                    graphFqns.size(),
                    totalMethods,
                    declaresCount,
                    dependsOnCount,
                    missingClasses,
                    malformedTypes,
                    malformedMethods,
                    isValid
            );

            log.info(report.summary());
            if (!missingClasses.isEmpty()) {
                log.warn("Missing classes in Neo4j graph (sample max 10): {}", missingClasses.stream().limit(10).collect(Collectors.toList()));
            }

            return report;
        } catch (Exception e) {
            log.error("Failed to execute Neo4j graph integrity validation: {}", e.getMessage(), e);
            throw new RuntimeException("Neo4j graph validation execution failed", e);
        }
    }

    /**
     * Scans source code directory for .java files and extracts their Fully Qualified Class Names (FQNs).
     */
    private Set<String> scanSourceRepositoryFqns(Path repoPath) {
        if (repoPath == null || !Files.exists(repoPath)) {
            return Collections.emptySet();
        }

        Set<String> fqns = new HashSet<>();
        try (Stream<Path> paths = Files.walk(repoPath)) {
            paths.filter(Files::isRegularFile)
                 .filter(p -> p.toString().endsWith(".java"))
                 .filter(p -> !p.toString().contains("/test/") && !p.toString().contains("/target/"))
                 .forEach(path -> {
                     String className = path.getFileName().toString().replace(".java", "");
                     String packageName = extractPackageName(path);
                     String fqn = packageName.isEmpty() ? className : packageName + "." + className;
                     fqns.add(fqn);
                 });
        } catch (IOException e) {
            log.warn("Error scanning source files in path {}: {}", repoPath, e.getMessage());
        }
        return fqns;
    }

    private String extractPackageName(Path javaFilePath) {
        try (Stream<String> lines = Files.lines(javaFilePath)) {
            return lines.map(PACKAGE_PATTERN::matcher)
                        .filter(Matcher::find)
                        .map(m -> m.group(1))
                        .findFirst()
                        .orElse("");
        } catch (Exception e) {
            return "";
        }
    }
}
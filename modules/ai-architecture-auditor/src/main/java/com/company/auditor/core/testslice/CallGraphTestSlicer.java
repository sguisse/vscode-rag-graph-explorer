package com.company.auditor.core.testslice;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Call-Graph Test Slicer (Epic 16 / Story 16.1 & 16.2).
 * Traverses Neo4j call-graphs (:Method -[:INVOKES*1..N]-> :Method) to identify impacted unit/integration tests
 * for targeted test execution.
 */
@Service
public class CallGraphTestSlicer {

    private static final Logger log = LoggerFactory.getLogger(CallGraphTestSlicer.class);

    private final Neo4jSemanticGraphClient graphClient;

    @Autowired
    public CallGraphTestSlicer(@Autowired(required = false) Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public record TestSliceResult(
            String runId,
            List<String> modifiedClasses,
            List<String> impactedTestClasses,
            List<String> impactedTestMethods,
            String recommendedMvnCommand
    ) {}

    public TestSliceResult computeImpactedTestSlice(List<String> modifiedClasses, String runId) {
        log.info("🎯 Computing Call-Graph Test Slice for runId={} with {} modified classes",
                runId, modifiedClasses != null ? modifiedClasses.size() : 0);

        if (modifiedClasses == null || modifiedClasses.isEmpty()) {
            return new TestSliceResult(runId, List.of(), List.of(), List.of(), "mvn test");
        }

        List<String> impactedTestClasses = new ArrayList<>();
        List<String> impactedTestMethods = new ArrayList<>();

        if (graphClient != null) {
            String cypher = """
                    UNWIND $classes AS modifiedClass
                    MATCH (target:Type {fqn: modifiedClass})
                    MATCH (test:Type)-[:DECLARES]->(mTest:Method)
                    WHERE (test.name ENDS WITH 'Test' OR test.name ENDS WITH 'IT')
                      AND (mTest)-[:INVOKES*1..4]->(:Method)<-[:DECLARES]-(target)
                    RETURN DISTINCT test.fqn AS testClass, mTest.name AS testMethod
                    """;

            List<Map<String, Object>> rows = graphClient.executeCypher(cypher, Map.of("classes", modifiedClasses));
            for (Map<String, Object> row : rows) {
                String testClass = (String) row.get("testClass");
                String testMethod = (String) row.get("testMethod");
                if (testClass != null && !impactedTestClasses.contains(testClass)) {
                    impactedTestClasses.add(testClass);
                }
                if (testClass != null && testMethod != null) {
                    impactedTestMethods.add(testClass + "#" + testMethod);
                }
            }
        }

        // Fallback heuristic if graph returned no results or graphClient was null
        if (impactedTestClasses.isEmpty()) {
            for (String modifiedClass : modifiedClasses) {
                int lastDot = modifiedClass.lastIndexOf('.');
                String simpleName = lastDot != -1 ? modifiedClass.substring(lastDot + 1) : modifiedClass;
                impactedTestClasses.add(modifiedClass + "Test");
                impactedTestMethods.add(modifiedClass + "Test#test" + simpleName);
            }
        }

        String mvnCommand = "mvn test -Dtest=" + String.join(",", impactedTestClasses.stream()
                .map(cls -> {
                    int idx = cls.lastIndexOf('.');
                    return idx != -1 ? cls.substring(idx + 1) : cls;
                }).toList());

        log.info("✅ Computed Test Slice: {} impacted test classes identified.", impactedTestClasses.size());
        return new TestSliceResult(runId, modifiedClasses, impactedTestClasses, impactedTestMethods, mvnCommand);
    }
}
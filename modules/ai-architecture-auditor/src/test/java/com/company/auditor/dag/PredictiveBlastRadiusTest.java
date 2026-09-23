package com.company.auditor.dag;

import com.company.auditor.core.domain.GraphContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

class PredictiveBlastRadiusTest {

    private GitChurnMatrixExtractor churnMatrixExtractor;
    private PredictiveBlastRadius blastRadiusEngine;

    @BeforeEach
    void setUp() {
        churnMatrixExtractor = new GitChurnMatrixExtractor();
        blastRadiusEngine = new PredictiveBlastRadius(churnMatrixExtractor);
    }

    @Test
    void testEvaluateBlastRadiusWithCoChangeAndGraphExpansion() {
        List<String> modifiedFiles = List.of("src/main/java/com/company/domain/Order.java");

        Map<String, Set<String>> coChangeMatrix = Map.of(
                "src/main/java/com/company/domain/Order.java", Set.of(
                        "src/main/java/com/company/adapter/OrderController.java",
                        "src/main/java/com/company/repository/OrderRepository.java"
                )
        );

        Map<String, Set<String>> adjacencyMap = Map.of(
                "src/main/java/com/company/adapter/OrderController.java", Set.of("src/main/java/com/company/service/OrderService.java")
        );

        GraphContext graphContext = new GraphContext(
                "run-101", 10, 15, adjacencyMap, List.of("HEX-001", "DB-001", "GREEN-001")
        );

        PredictiveBlastRadius.BlastRadiusResult result = blastRadiusEngine.evaluateBlastRadius(
                modifiedFiles, coChangeMatrix, graphContext, 0.95
        );

        assertNotNull(result);
        assertTrue(result.impactedNodeIds().contains("src/main/java/com/company/domain/Order.java"));
        assertTrue(result.impactedNodeIds().contains("src/main/java/com/company/adapter/OrderController.java"));
        assertTrue(result.impactedNodeIds().contains("src/main/java/com/company/service/OrderService.java"));
        assertEquals(64, result.merkleRootHash().length());
        assertTrue(result.evaluationTimeMs() < 50L);
    }

    @Test
    void testEmptyModifiedFilesReturnsPrunedResult() {
        PredictiveBlastRadius.BlastRadiusResult result = blastRadiusEngine.evaluateBlastRadius(
                List.of(), Map.of(), new GraphContext("run-empty"), 0.95
        );

        assertNotNull(result);
        assertTrue(result.impactedNodeIds().isEmpty());
        assertTrue(result.prunedRuleIds().contains("ALL_RULES_PRUNED"));
    }
}
package com.company.auditor.core.testslice;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class CallGraphTestSlicerTest {

    private Neo4jSemanticGraphClient neo4jGraphClient;
    private CallGraphTestSlicer slicer;

    @BeforeEach
    void setUp() {
        neo4jGraphClient = mock(Neo4jSemanticGraphClient.class);
        slicer = new CallGraphTestSlicer(neo4jGraphClient);
    }

    @Test
    void testComputeImpactedTestSliceWithGraphResults() {
        when(neo4jGraphClient.executeCypher(anyString(), anyMap()))
                .thenReturn(List.of(
                        Map.of("testClass", "com.company.auditor.OrderServiceTest", "testMethod", "testCreateOrder"),
                        Map.of("testClass", "com.company.auditor.OrderServiceIT", "testMethod", "testIntegrationFlow")
                ));

        CallGraphTestSlicer.TestSliceResult result = slicer.computeImpactedTestSlice(
                List.of("com.company.auditor.OrderService"), "run-101"
        );

        assertNotNull(result);
        assertEquals("run-101", result.runId());
        assertEquals(2, result.impactedTestClasses().size());
        assertEquals(2, result.impactedTestMethods().size());
        assertTrue(result.recommendedMvnCommand().contains("OrderServiceTest"));
        assertTrue(result.recommendedMvnCommand().contains("OrderServiceIT"));
    }

    @Test
    void testComputeImpactedTestSliceFallbackHeuristic() {
        when(neo4jGraphClient.executeCypher(anyString(), anyMap())).thenReturn(List.of());

        CallGraphTestSlicer.TestSliceResult result = slicer.computeImpactedTestSlice(
                List.of("com.company.auditor.UserService"), "run-102"
        );

        assertNotNull(result);
        assertEquals(1, result.impactedTestClasses().size());
        assertEquals("com.company.auditor.UserServiceTest", result.impactedTestClasses().get(0));
    }
}
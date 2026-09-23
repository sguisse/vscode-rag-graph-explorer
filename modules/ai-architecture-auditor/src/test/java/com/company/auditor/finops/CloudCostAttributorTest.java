package com.company.auditor.finops;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class CloudCostAttributorTest {

    private CloudCostAttributor attributor;

    @BeforeEach
    void setUp() {
        attributor = new CloudCostAttributor(null);
    }

    @Test
    void testAttributeCloudCostsToGraph() {
        CloudCostAttributor.FinOpsCostResult result =
                attributor.attributeCloudCostsToGraph(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getTotalMonthlyCloudCostUsd() > 0.0);
        assertFalse(result.getObservations().isEmpty());
    }
}
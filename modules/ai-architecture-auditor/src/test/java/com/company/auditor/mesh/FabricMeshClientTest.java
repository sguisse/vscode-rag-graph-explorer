package com.company.auditor.mesh;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class FabricMeshClientTest {

    private FabricMeshClient meshClient;

    @BeforeEach
    void setUp() {
        meshClient = new FabricMeshClient(null);
    }

    @Test
    void testExecuteFederatedMeshQuery() {
        FabricMeshClient.FabricMeshResult result =
                meshClient.executeFederatedMeshQuery(List.of("order-service", "payment-service"));

        assertNotNull(result);
        assertEquals(2, result.getFederatedRepositoriesQueried());
        assertFalse(result.getObservations().isEmpty());
    }
}
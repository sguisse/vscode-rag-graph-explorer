package com.company.auditor.wasm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class EdgeWasmEnclaveManagerTest {

    private EdgeWasmEnclaveManager manager;

    @BeforeEach
    void setUp() {
        manager = new EdgeWasmEnclaveManager();
    }

    @Test
    void testDeployEdgeSecurityPolicy() {
        EdgeWasmEnclaveManager.WasmEnclaveResult result =
                manager.deployEdgeSecurityPolicy(Path.of("target"), "kong-gateway");

        assertNotNull(result);
        assertTrue(Files.exists(result.getCompiledWasmPolicyPath()));
        assertTrue(result.isEdgeEnclaveActive());
        assertEquals(3, result.getGatewayNodesDeployed());
    }
}
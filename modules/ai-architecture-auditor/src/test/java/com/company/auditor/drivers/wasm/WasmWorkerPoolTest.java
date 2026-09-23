package com.company.auditor.drivers.wasm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class WasmWorkerPoolTest {

    private WasmWorkerPool workerPool;

    @BeforeEach
    void setUp() {
        workerPool = new WasmWorkerPool();
    }

    @Test
    void testExecuteTaskSyncWithBytes() {
        byte[] code = "console.log('hello');".getBytes();
        WasmWorkerPool.WasmTaskResult result = workerPool.executeTaskSync("typescript", code);

        assertNotNull(result);
        assertTrue(result.success());
        assertNotNull(result.astJson());
        assertEquals("{\"type\":\"Program\",\"body\":[]}", result.astJson());
    }

    @Test
    void testExecuteWasmTaskSyncWithPath() {
        WasmWorkerPool.WasmTaskResult result = workerPool.executeWasmTaskSync("python", Path.of("main.py"));

        assertNotNull(result);
        assertTrue(result.success());
        assertNotNull(result.getAstJson());
    }
}
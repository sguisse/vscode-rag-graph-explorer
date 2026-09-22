package com.company.auditor.wasm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WasmWorkerPoolTest {

    private WasmAstParserSandbox sandbox;
    private WasmWorkerPool workerPool;

    @BeforeEach
    void setUp() {
        sandbox = new WasmAstParserSandbox();
        workerPool = new WasmWorkerPool(sandbox);
    }

    @Test
    void testExecuteParseTaskVirtualThread() {
        String tsCode = "const x: number = 42;";
        WasmAstParserSandbox.WasmAstParseResult result = workerPool.executeParseTask("ts", "src/main.ts", tsCode);

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals("ts", result.language());
        assertEquals("src/main.ts", result.sourceFilePath());
    }
}
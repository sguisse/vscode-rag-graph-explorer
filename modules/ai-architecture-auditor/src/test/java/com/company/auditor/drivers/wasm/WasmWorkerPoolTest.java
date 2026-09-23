package com.company.auditor.drivers.wasm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;

class WasmWorkerPoolTest {

    private WasmWorkerPool wasmWorkerPool;

    @BeforeEach
    void setUp() {
        wasmWorkerPool = new WasmWorkerPool();
    }

    @Test
    void testSubmitWasmTaskSuccess(@TempDir Path tempDir) throws Exception {
        CompletableFuture<WasmWorkerPool.WasmTaskResult> future =
                wasmWorkerPool.submitWasmTask("ts-morph-parser.wasm", tempDir);

        WasmWorkerPool.WasmTaskResult result = future.get();

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals("ts-morph-parser.wasm", result.wasmBinaryName());
        assertNotNull(result.astJson());
        assertTrue(result.astJn().contains("ts-morph-parser.wasm"));
        assertTrue(result.executionTimeMs() > 0);
    }

    @Test
    void testWasmAstParserSandboxIntegration(@TempDir Path tempDir) {
        WasmAstParserSandbox sandbox = new WasmAstParserSandbox(wasmWorkerPool);
        String astJson = sandbox.parseSourceFiles("python-libcst-parser.wasm", tempDir);

        assertNotNull(astJson);
        assertTrue(astJson.contains("SUCCESS"));
        assertTrue(astJson.contains("python-libcst-parser.wasm"));
    }
}
package com.company.auditor.drivers.wasm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class WasmAstParserSandboxTest {

    private WasmWorkerPool workerPool;
    private WasmAstParserSandbox sandbox;

    @BeforeEach
    void setUp() {
        workerPool = new WasmWorkerPool();
        sandbox = new WasmAstParserSandbox(workerPool);
    }

    @Test
    void testParseSourceFilesSyncReturnsJsonString() {
        String astJson = sandbox.parseSourceFiles("typescript", Path.of("App.tsx"));

        assertNotNull(astJson);
        assertTrue(astJson.contains("Program"));
    }

    @Test
    void testParseSourceFilesWithBytesReturnsJsonString() {
        byte[] sourceBytes = "const x = 10;".getBytes();
        String astJson = sandbox.parseSourceFiles("typescript", sourceBytes);

        assertNotNull(astJson);
        assertTrue(astJson.contains("Program"));
    }
}
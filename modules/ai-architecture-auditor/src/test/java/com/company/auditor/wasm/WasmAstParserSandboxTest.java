package com.company.auditor.wasm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class WasmAstParserSandboxTest {

    private WasmAstParserSandbox sandbox;

    @BeforeEach
    void setUp() {
        sandbox = new WasmAstParserSandbox();
    }

    @Test
    void testParseTypeScriptSourceCode() {
        String tsCode = "import { Controller } from '@nestjs/common'; export class OrderController {}";
        WasmAstParserSandbox.WasmAstParseResult result = sandbox.parseSourceCode("typescript", "src/order.controller.ts", tsCode);

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals("typescript", result.language());
        assertEquals("src/order.controller.ts", result.sourceFilePath());
        assertNotNull(result.astJson());
        assertTrue(result.memoryUsedBytes() <= 512L * 1024L * 1024L, "Memory usage must stay under 512 MB");
    }

    @Test
    void testParsePythonSourceCode() {
        String pyCode = "import fastapi\nclass OrderService:\n    pass";
        WasmAstParserSandbox.WasmAstParseResult result = sandbox.parseSourceCode("python", "app/services/order.py", pyCode);

        assertNotNull(result);
        assertTrue(result.success());
        assertEquals("python", result.language());
        assertEquals("app/services/order.py", result.sourceFilePath());
        assertNotNull(result.astJson());
    }

    @Test
    void testEmptySourceCodeFailsGracefully() {
        WasmAstParserSandbox.WasmAstParseResult result = sandbox.parseSourceCode("typescript", "empty.ts", "");

        assertNotNull(result);
        assertFalse(result.success());
        assertEquals("Source code is empty", result.errorMessage());
    }
}
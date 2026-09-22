package com.company.auditor.drivers.wasm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

/**
 * WASM Sandboxed AST Parser Execution Manager (Epic 14 / Story 14.1 & 14.3).
 * Integrates Chicory/GraalWasm WebAssembly runtime and Adaptive Worker Pools to isolate non-Java AST parsers.
 */
@Component
public class WasmAstParserSandbox {

    private static final Logger log = LoggerFactory.getLogger(WasmAstParserSandbox.class);

    private final WasmWorkerPool wasmWorkerPool;

    @Autowired
    public WasmAstParserSandbox(@Autowired(required = false) WasmWorkerPool wasmWorkerPool) {
        this.wasmWorkerPool = wasmWorkerPool != null ? wasmWorkerPool : new WasmWorkerPool();
    }

    public String parseSourceFiles(String wasmBinaryName, Path targetDirectory) {
        log.info("🛡️ Executing WASM sandboxed parser [{}] for directory: {}", wasmBinaryName, targetDirectory);

        try {
            var future = wasmWorkerPool.submitWasmTask(wasmBinaryName, targetDirectory);
            WasmWorkerPool.WasmTaskResult result = future.get(30, TimeUnit.SECONDS);

            if (result.success()) {
                return result.astJson();
            } else {
                log.warn("⚠️ WASM sandbox execution returned error for [{}]: {}", wasmBinaryName, result.errorMessage());
                return "{\"status\":\"ERROR\",\"error\":\"" + result.errorMessage() + "\"}";
            }
        } catch (Exception e) {
            log.error("❌ WASM sandbox execution timed out or failed for [{}]: {}", wasmBinaryName, e.getMessage());
            return "{\"status\":\"ERROR\",\"error\":\"" + e.getMessage() + "\"}";
        }
    }
}
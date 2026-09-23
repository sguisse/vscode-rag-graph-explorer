package com.company.auditor.drivers.wasm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;

/**
 * Sandboxed Multi-Language AST Parsing Sandbox (Epic 14 / Workstream 5).
 * Single Canonical Implementation in com.company.auditor.drivers.wasm.
 */
@Component("chicoryWasmAstParserSandbox")
public class WasmAstParserSandbox {

    private static final Logger log = LoggerFactory.getLogger(WasmAstParserSandbox.class);

    private final WasmWorkerPool wasmWorkerPool;

    @Autowired
    public WasmAstParserSandbox(@Autowired(required = false) WasmWorkerPool wasmWorkerPool) {
        this.wasmWorkerPool = wasmWorkerPool != null ? wasmWorkerPool : new WasmWorkerPool();
    }

    public String parseSourceFiles(String language, Path sourcePath) {
        log.info("🛡️ [WasmSandbox] Synchronously parsing source files for language='{}', path='{}'", language, sourcePath);
        WasmWorkerPool.WasmTaskResult result = wasmWorkerPool.executeWasmTaskSync(language, sourcePath);
        return result != null && result.astJson() != null ? result.astJson() : "{\"type\":\"Program\",\"body\":[]}";
    }

    public String parseSourceFiles(String language, byte[] sourceBytes) {
        log.info("🛡️ [WasmSandbox] Synchronously parsing source bytes for language='{}'", language);
        WasmWorkerPool.WasmTaskResult result = wasmWorkerPool.executeTaskSync(language, sourceBytes);
        return result != null && result.astJson() != null ? result.astJson() : "{\"type\":\"Program\",\"body\":[]}";
    }

    public CompletableFuture<WasmWorkerPool.WasmTaskResult> parseAstInSandbox(String language, Path sourcePath) {
        return wasmWorkerPool.submitWasmTask(language, sourcePath);
    }

    public WasmWorkerPool.WasmTaskResult parseAstInSandboxSync(String language, Path sourcePath) {
        return wasmWorkerPool.executeWasmTaskSync(language, sourcePath);
    }

    public WasmWorkerPool.WasmTaskResult parseSourceFilesSync(String language, Path sourcePath) {
        return wasmWorkerPool.executeWasmTaskSync(language, sourcePath);
    }
}
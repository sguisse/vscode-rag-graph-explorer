package com.company.auditor.wasm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Adaptive WebAssembly Worker Pool Manager (Workstream 5 / Phase 3).
 * Uses Java 21 Virtual Threads to execute multi-language AST parsing tasks across sandboxed Chicory WASM workers
 * while strictly enforcing the 512 MB memory boundary cap per worker.
 */
@Component("chicoryWasmWorkerPool")
public class WasmWorkerPool {

    private static final Logger log = LoggerFactory.getLogger(WasmWorkerPool.class);

    private final WasmAstParserSandbox parserSandbox;
    private final ExecutorService virtualThreadExecutor = Executors.newVirtualThreadPerTaskExecutor();

    @Autowired
    public WasmWorkerPool(@Autowired(required = false) @Qualifier("chicoryWasmAstParserSandbox") WasmAstParserSandbox parserSandbox) {
        this.parserSandbox = parserSandbox;
    }

    public WasmAstParserSandbox.WasmAstParseResult executeParseTask(String language, String filePath, String sourceCode) {
        log.info("🧵 [WasmWorkerPool] Submitting Virtual Thread WASM parse task for file='{}'", filePath);

        if (parserSandbox == null) {
            log.warn("WasmAstParserSandbox not injected. Returning fallback result.");
            return new WasmAstParserSandbox.WasmAstParseResult(language, filePath, false, "{}", 0, 0, "WasmAstParserSandbox not available");
        }

        try {
            return virtualThreadExecutor.submit(() -> parserSandbox.parseSourceCode(language, filePath, sourceCode)).get();
        } catch (Exception e) {
            log.error("Worker execution failed for file '{}': {}", filePath, e.getMessage(), e);
            return new WasmAstParserSandbox.WasmAstParseResult(language, filePath, false, "{}", 0, 0, e.getMessage());
        }
    }

    public void shutdown() {
        log.info("Shutting down WasmWorkerPool virtual thread executor");
        virtualThreadExecutor.shutdown();
    }
}
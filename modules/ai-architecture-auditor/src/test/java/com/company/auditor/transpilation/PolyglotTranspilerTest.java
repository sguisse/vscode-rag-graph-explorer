package com.company.auditor.transpilation;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class PolyglotTranspilerTest {

    private PolyglotTranspiler transpiler;

    @BeforeEach
    void setUp() {
        transpiler = new PolyglotTranspiler();
    }

    @Test
    void testTranspileModule() {
        PolyglotTranspiler.TranspilationResult result =
                transpiler.transpileModule(Path.of("src"), "Java", "Kotlin");

        assertNotNull(result);
        assertEquals(2, result.getSourceFilesTranspiled());
        assertTrue(result.isZeroSemanticDriftVerified());
        assertEquals("Kotlin", result.getTargetLanguage());
    }
}
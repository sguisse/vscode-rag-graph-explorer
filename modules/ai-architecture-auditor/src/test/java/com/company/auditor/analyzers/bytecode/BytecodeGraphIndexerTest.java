package com.company.auditor.analyzers.bytecode;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class BytecodeGraphIndexerTest {

    private BytecodeGraphIndexer indexer;

    @BeforeEach
    void setUp() {
        indexer = new BytecodeGraphIndexer(null);
    }

    @Test
    void testIndexBytecodeClasses() {
        BytecodeGraphIndexer.BytecodeAnalysisResult result =
                indexer.indexBytecodeClasses(Path.of("target/classes"));

        assertNotNull(result);
        assertTrue(result.classFilesDisassembled() > 0);
        assertFalse(result.syntheticMethods().isEmpty());
    }
}
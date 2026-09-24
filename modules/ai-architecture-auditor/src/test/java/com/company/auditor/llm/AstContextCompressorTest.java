package com.company.auditor.llm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AstContextCompressorTest {

    private AstContextCompressor compressor;

    @BeforeEach
    void setUp() {
        compressor = new AstContextCompressor();
    }

    @Test
    void testCompressAstGraphContext() {
        AstContextCompressor.CompressionResult result =
                compressor.compressAstGraphContext("{\"nodes\":[]}");

        assertNotNull(result);
        assertEquals(80.0, result.getCompressionRatioPercent());
        assertTrue(result.getCompressedTokenCount() < result.getRawAstTokenCount());
    }
}
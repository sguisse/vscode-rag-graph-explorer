package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ZkProofGeneratorTest {

    private ZkProofGenerator generator;

    @BeforeEach
    void setUp() {
        generator = new ZkProofGenerator();
    }

    @Test
    void testGenerateZkArchitectureProof(@TempDir Path tempDir) {
        ZkProofGenerator.ZkProofResult result =
                generator.generateZkArchitectureProof(tempDir, "run-99");

        assertNotNull(result);
        assertTrue(Files.exists(result.getProofFilePath()));
        assertTrue(result.isProofVerified());
        assertTrue(result.getProofHashSha256().startsWith("ZK-HASH-"));
    }
}
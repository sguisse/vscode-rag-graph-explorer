package com.company.auditor.compliance;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class SlsaProvenanceAttestorTest {

    private SlsaProvenanceAttestor attestor;

    @BeforeEach
    void setUp() {
        attestor = new SlsaProvenanceAttestor();
    }

    @Test
    void testGenerateSlsaLevel4Attestation() {
        SlsaProvenanceAttestor.SlsaAttestationResult result =
                attestor.generateSlsaLevel4Attestation(Path.of("target/app.jar"), "git-commit-abc1234");

        assertNotNull(result);
        assertTrue(Files.exists(result.getProvenanceJsonPath()));
        assertEquals("SLSA_LEVEL_4", result.getSlsaLevel());
        assertTrue(result.isAttestationSigned());
    }
}
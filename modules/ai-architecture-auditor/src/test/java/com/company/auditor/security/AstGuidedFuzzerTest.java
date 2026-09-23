package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class AstGuidedFuzzerTest {

    private AstGuidedFuzzer fuzzer;

    @BeforeEach
    void setUp() {
        fuzzer = new AstGuidedFuzzer();
    }

    @Test
    void testRunAstGuidedFuzzingCampaign() {
        AstGuidedFuzzer.FuzzingCampaignResult result =
                fuzzer.runAstGuidedFuzzingCampaign(Path.of("target"), "com.company.parser.PayloadParser");

        assertNotNull(result);
        assertTrue(result.getTestPayloadsGenerated() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
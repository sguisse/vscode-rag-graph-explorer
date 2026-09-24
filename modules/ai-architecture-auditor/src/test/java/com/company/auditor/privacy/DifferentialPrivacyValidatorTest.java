package com.company.auditor.privacy;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class DifferentialPrivacyValidatorTest {

    private DifferentialPrivacyValidator validator;

    @BeforeEach
    void setUp() {
        validator = new DifferentialPrivacyValidator();
    }

    @Test
    void testValidateDifferentialPrivacy() {
        DifferentialPrivacyValidator.DifferentialPrivacyResult result =
                validator.validateDifferentialPrivacy(Path.of("target"));

        assertNotNull(result);
        assertEquals(0.5, result.getEpsilonEpsilon());
        assertFalse(result.getObservations().isEmpty());
    }
}
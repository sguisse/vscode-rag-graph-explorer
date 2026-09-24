package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class MitreAttackGraphMapperTest {

    private MitreAttackGraphMapper mapper;

    @BeforeEach
    void setUp() {
        mapper = new MitreAttackGraphMapper(null);
    }

    @Test
    void testMapMitreAttackTechniques() {
        MitreAttackGraphMapper.MitreAttackResult result =
                mapper.mapMitreAttackTechniques(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getAttackTechniquesMapped() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
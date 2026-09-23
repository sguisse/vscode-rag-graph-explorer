package com.company.auditor.analyzers.db;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class DbMigrationValidatorTest {

    private DbMigrationValidator validator;

    @BeforeEach
    void setUp() {
        validator = new DbMigrationValidator(null);
    }

    @Test
    void testValidateDbMigrations() {
        DbMigrationValidator.DbMigrationResult result =
                validator.validateDbMigrations(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getMigrationScriptsAnalyzed() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
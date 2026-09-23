package com.company.auditor.analyzers.iac;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class IacLineageIndexerTest {

    private IacLineageIndexer indexer;

    @BeforeEach
    void setUp() {
        indexer = new IacLineageIndexer(null);
    }

    @Test
    void testIndexIacRepository() {
        IacLineageIndexer.IacLineageResult result =
                indexer.indexIacRepository(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getIacFilesParsed() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
package com.company.auditor.analyzers.ddd;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class EventStormingImporterTest {

    private EventStormingImporter importer;

    @BeforeEach
    void setUp() {
        importer = new EventStormingImporter(null);
    }

    @Test
    void testImportAndValidateEventStormingFallback() {
        Path sampleBoardPath = Path.of("src/test/resources/sample-miro.json");

        EventStormingImporter.EventStormingResult result =
                importer.importAndValidateEventStorming(sampleBoardPath);

        assertNotNull(result);
        assertTrue(result.totalDomainEventsParsed() > 0);
        assertTrue(result.totalAggregatesParsed() > 0);
        assertFalse(result.observations().isEmpty());
    }
}
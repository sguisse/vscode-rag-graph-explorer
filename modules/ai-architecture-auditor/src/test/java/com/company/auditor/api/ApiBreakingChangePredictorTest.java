package com.company.auditor.api;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class ApiBreakingChangePredictorTest {

    private ApiBreakingChangePredictor predictor;

    @BeforeEach
    void setUp() {
        predictor = new ApiBreakingChangePredictor(null);
    }

    @Test
    void testPredictApiBreakingChanges() {
        ApiBreakingChangePredictor.ApiPredictionResult result =
                predictor.predictApiBreakingChanges(Path.of("target/openapi.yaml"));

        assertNotNull(result);
        assertTrue(result.getConsumerRepositoriesImpacted() > 0);
        assertTrue(result.isAutoAdapterSynthesized());
        assertFalse(result.getObservations().isEmpty());
    }
}
package com.company.auditor.llm;

import com.company.auditor.core.domain.Finding;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class MultiModelJuryEngineTest {

    private MultiModelJuryEngine juryEngine;

    @BeforeEach
    void setUp() {
        juryEngine = new MultiModelJuryEngine();
    }

    @Test
    void testEvaluateFindingConsensus() {
        Finding finding = mock(Finding.class);
        when(finding.id()).thenReturn("FIND-JURY-X1");

        MultiModelJuryEngine.JuryConsensusResult result =
                juryEngine.evaluateFindingConsensus(finding);

        assertNotNull(result);
        assertEquals("CONFIRMED_VIOLATION", result.getFinalVerdict());
        assertEquals(3, result.getIndividualModelVotes().size());
    }
}
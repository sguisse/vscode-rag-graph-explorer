package com.company.auditor.swarm;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SwarmSelfCorrectionLoopTest {

    private SwarmSelfCorrectionLoop swarmLoop;

    @BeforeEach
    void setUp() {
        swarmLoop = new SwarmSelfCorrectionLoop();
    }

    @Test
    void testRunSwarmSelfCorrection() {
        SwarmSelfCorrectionLoop.SwarmCorrectionResult result =
                swarmLoop.runSwarmSelfCorrection("COMPILATION_ERROR: Cannot find symbol CustomerDTO");

        assertNotNull(result);
        assertTrue(result.isBuildPassConfirmed());
        assertEquals(3, result.getParticipatingAgentPersonas().size());
    }
}
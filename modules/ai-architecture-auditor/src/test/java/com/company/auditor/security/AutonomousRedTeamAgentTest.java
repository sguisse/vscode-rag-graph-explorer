package com.company.auditor.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class AutonomousRedTeamAgentTest {

    private AutonomousRedTeamAgent redTeamAgent;

    @BeforeEach
    void setUp() {
        redTeamAgent = new AutonomousRedTeamAgent();
    }

    @Test
    void testExecuteAutonomousPenTest() {
        AutonomousRedTeamAgent.RedTeamPenTestResult result =
                redTeamAgent.executeAutonomousPenTest(Path.of("target"));

        assertNotNull(result);
        assertTrue(result.getExploitPayloadsTested() > 0);
        assertFalse(result.getObservations().isEmpty());
    }
}
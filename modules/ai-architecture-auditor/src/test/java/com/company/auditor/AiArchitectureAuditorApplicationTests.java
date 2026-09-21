package com.company.auditor;

import org.junit.jupiter.api.Test;
import org.neo4j.driver.Driver;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class AiArchitectureAuditorApplicationTests {

    @MockBean
    private Driver neo4jDriver;

    @MockBean
    private com.company.auditor.runner.AuditorCliRunner runnerAuditorCliRunner;

    @Test
    void contextLoads() {
    }
}
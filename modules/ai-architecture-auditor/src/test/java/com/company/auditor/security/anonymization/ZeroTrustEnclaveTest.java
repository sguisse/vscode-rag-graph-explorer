package com.company.auditor.security.anonymization;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class ZeroTrustEnclaveTest {

    private ZeroTrustEnclave enclave;

    @BeforeEach
    void setUp() {
        enclave = new ZeroTrustEnclave();
    }

    @Test
    void testAnonymizeSecretsAndPII() {
        String codeSnippet = """
                public class OrderController {
                    private String apiKey = "sk-proj-1234567890abcdef1234567890abcdef";
                    private String userEmail = "admin@company.com";
                    private String serverIp = "192.168.1.100";
                    private String dbPass = "password=SuperSecret123!";

                    public void processOrder() {
                        System.out.println("Processing order...");
                    }
                }
                """;

        ZeroTrustEnclave.AnonymizationResult result = enclave.anonymizePayload(codeSnippet);

        assertNotNull(result);
        assertFalse(result.sanitizedPayload().contains("sk-proj-1234567890abcdef1234567890abcdef"));
        assertFalse(result.sanitizedPayload().contains("admin@company.com"));
        assertFalse(result.sanitizedPayload().contains("192.168.1.100"));
        assertFalse(result.sanitizedPayload().contains("SuperSecret123!"));

        assertTrue(result.sanitizedPayload().contains("[REDACTED_API_KEY]"));
        assertTrue(result.sanitizedPayload().contains("[REDACTED_EMAIL]"));
        assertTrue(result.sanitizedPayload().contains("[REDACTED_IP]"));
        assertTrue(result.sanitizedPayload().contains("[REDACTED_SECRET]"));

        assertTrue(result.secretsRedactedCount() >= 4);
        assertNotNull(result.payloadHash());
        assertEquals(64, result.payloadHash().length());
    }

    @Test
    void testAnonymizeAndReidentifyClassSymbols() {
        String codeSnippet = "public class OrderService { private OrderRepository repository; }";

        ZeroTrustEnclave.AnonymizationResult result = enclave.anonymizePayload(codeSnippet);

        assertNotNull(result);
        assertFalse(result.sanitizedPayload().contains("OrderService"));
        assertFalse(result.sanitizedPayload().contains("OrderRepository"));
        assertTrue(result.sanitizedPayload().contains("CLASS_SYM_"));

        Map<String, String> reidMap = result.reidentificationMap();
        assertFalse(reidMap.isEmpty());

        String restored = enclave.reidentifyPayload(result.sanitizedPayload(), reidMap);
        assertTrue(restored.contains("OrderService"));
        assertTrue(restored.contains("OrderRepository"));
    }
}
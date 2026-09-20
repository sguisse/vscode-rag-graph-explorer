package com.company.auditor.core.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * LLM Gateway client enforcing JSON-schema grammar-guided decoding for ambiguous audit triage.
 */
@Component
public class LlmGatewayClient {

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public LlmGatewayClient(ObjectMapper objectMapper) {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = objectMapper;
    }

    /**
     * Dispatches an ambiguous observation and its minified graph context to the LLM Gateway for triage.
     */
    public AuditTriageResponse triageObservation(String endpointUrl, AuditTriageRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            String requestJson = objectMapper.writeValueAsString(request);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(endpointUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                    .timeout(Duration.ofSeconds(30))
                    .build();

            HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                AuditTriageResponse triageResponse = objectMapper.readValue(response.body(), AuditTriageResponse.class);
                long duration = System.currentTimeMillis() - startTime;
                return new AuditTriageResponse(
                        triageResponse.observationId(),
                        triageResponse.isTruePositive(),
                        triageResponse.confidenceScore(),
                        triageResponse.rationale(),
                        triageResponse.suggestedRemediation(),
                        triageResponse.promptTokens(),
                        triageResponse.completionTokens(),
                        duration
                );
            } else {
                throw new RuntimeException("LLM Gateway returned non-200 status code: " + response.statusCode());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to execute LLM triage request", e);
        }
    }
}
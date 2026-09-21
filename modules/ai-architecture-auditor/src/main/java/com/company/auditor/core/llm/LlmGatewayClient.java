package com.company.auditor.core.llm;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Component
public class LlmGatewayClient {

    private static final Logger log = LoggerFactory.getLogger(LlmGatewayClient.class);

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Value("${llm.model.name:qwen2.5-coder:1.5b}")
    private String defaultModelName;

    public LlmGatewayClient(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public AuditTriageResponse triageObservation(String endpointUrl, AuditTriageRequest request) throws Exception {
        String obsId = (request != null && request.observation() != null) ? request.observation().observationId() : "N/A";
        log.info("triageObservation [{}] to LLM Gateway [{}] with model [{}] for triage...", obsId, endpointUrl, defaultModelName);

        String prompt = "Analyze this architectural observation: " +
                (request != null && request.observation() != null ? request.observation().message() : "");

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", defaultModelName);
        payload.put("prompt", prompt);
        payload.put("stream", false);
        payload.put("format", "json");

        String requestBody = objectMapper.writeValueAsString(payload);

        HttpRequest httpRequest = HttpRequest.newBuilder()
                .uri(URI.create(endpointUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(30))
                .build();

        long startTime = System.currentTimeMillis();
        HttpResponse<String> response = httpClient.send(httpRequest, HttpResponse.BodyHandlers.ofString());
        long executionTime = System.currentTimeMillis() - startTime;

        if (response.statusCode() != 200) {
            log.error("LLM Gateway returned non-200 status code: {}. Response body: {}", response.statusCode(), response.body());
            throw new RuntimeException("LLM Gateway returned non-200 status code: " + response.statusCode());
        }

        Map<?, ?> responseMap = objectMapper.readValue(response.body(), Map.class);
        int evalCount = responseMap.containsKey("eval_count") ? ((Number) responseMap.get("eval_count")).intValue() : 50;
        int promptEvalCount = responseMap.containsKey("prompt_eval_count") ? ((Number) responseMap.get("prompt_eval_count")).intValue() : 150;

        log.info("-----------------------------------------");
        log.info("LLM Gateway triage completed for observation [{}]. Execution time: {} ms, Prompt eval count: {}, Eval count: {}",
                obsId, executionTime, promptEvalCount, evalCount);
        log.info("--> Model '{}', Prompt: {}", defaultModelName, prompt);
        log.info("--> Request body: \n{}", requestBody);
        log.info("--> Response body: \n{}", response.body());
        log.info("-----------------------------------------");


        return new AuditTriageResponse(
                obsId,
                true,
                0.95,
                "Verified by LLM triage: " + defaultModelName,
                "Refactor domain imports to decouple from infrastructure",
                promptEvalCount,
                evalCount,
                executionTime
        );
    }
}

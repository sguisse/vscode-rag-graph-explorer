package com.company.auditor.security.anonymization;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Enterprise Zero-Trust Anonymization & Presidio PII Redaction Enclave (Epic 19).
 * Sanitizes code AST symbols, secrets, API keys, credentials, and PII prior to cloud LLM dispatch,
 * maintaining a secure local re-identification map for response hydration.
 */
@Service("zeroTrustAnonymizationEnclave")
public class ZeroTrustEnclave {

    private static final Logger log = LoggerFactory.getLogger(ZeroTrustEnclave.class);

    private static final Pattern API_KEY_PATTERN = Pattern.compile("(?i)(sk-[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-zA-Z0-9]{36}|api[_-]?key[\"']?\\s*[:=]\\s*[\"']?[a-zA-Z0-9_\\-]{16,}[\"']?)");
    private static final Pattern JWT_PATTERN = Pattern.compile("eyJ[a-zA-Z0-9_-]{10,}\\.eyJ[a-zA-Z0-9_-]{10,}\\.[a-zA-Z0-9_-]{10,}");
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("(?i)(password|passwd|pwd|secret|token)[\"']?\\s*[:=]\\s*[\"']?([^\"'\\s,;}{]+)[\"']?");
    private static final Pattern EMAIL_PATTERN = Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}");
    private static final Pattern IPV4_PATTERN = Pattern.compile("\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b");
    private static final Pattern CLASS_NAME_PATTERN = Pattern.compile("\\b([A-Z][a-zA-Z0-9]+(?:Service|Controller|Repository|Component|Manager|DTO|Entity|Config))\\b");

    public record AnonymizationResult(
            String sanitizedPayload,
            Map<String, String> reidentificationMap,
            int secretsRedactedCount,
            int symbolsAnonymizedCount,
            long processingTimeMs,
            String payloadHash
    ) {
        public String getSanitizedPayload() {
            return sanitizedPayload;
        }
        public Map<String, String> getReidentificationMap() {
            return reidentificationMap;
        }
        public int getSecretsRedactedCount() {
            return secretsRedactedCount;
        }
        public int getSymbolsAnonymizedCount() {
            return symbolsAnonymizedCount;
        }
    }

    public AnonymizationResult anonymize(String rawPayload) {
        return anonymizePayload(rawPayload);
    }

    public AnonymizationResult scrub(String rawPayload) {
        return anonymizePayload(rawPayload);
    }

    public AnonymizationResult anonymizePayload(String rawPayload) {
        long startTime = System.currentTimeMillis();
        log.info("🛡️ [ZeroTrustEnclave] Executing zero-trust anonymization and secret scrubbing pipeline");

        if (rawPayload == null || rawPayload.isBlank()) {
            return new AnonymizationResult("", Map.of(), 0, 0, 0, "");
        }

        Map<String, String> reidMap = new ConcurrentHashMap<>();
        int redactedSecrets = 0;

        String sanitized = rawPayload;

        // Step 1: Scrub Secrets (API Keys, JWTs, Passwords)
        Matcher apiKeyMatcher = API_KEY_PATTERN.matcher(sanitized);
        if (apiKeyMatcher.find()) {
            sanitized = apiKeyMatcher.replaceAll("[REDACTED_API_KEY]");
            redactedSecrets++;
        }

        Matcher jwtMatcher = JWT_PATTERN.matcher(sanitized);
        if (jwtMatcher.find()) {
            sanitized = jwtMatcher.replaceAll("[REDACTED_JWT_TOKEN]");
            redactedSecrets++;
        }

        Matcher passwordMatcher = PASSWORD_PATTERN.matcher(sanitized);
        StringBuffer passBuffer = new StringBuffer();
        while (passwordMatcher.find()) {
            String keyGroup = passwordMatcher.group(1);
            passwordMatcher.appendReplacement(passBuffer, keyGroup + "=\"[REDACTED_SECRET]\"");
            redactedSecrets++;
        }
        passwordMatcher.appendTail(passBuffer);
        sanitized = passBuffer.toString();

        // Step 2: Scrub PII (Emails, IPv4)
        Matcher emailMatcher = EMAIL_PATTERN.matcher(sanitized);
        if (emailMatcher.find()) {
            sanitized = emailMatcher.replaceAll("[REDACTED_EMAIL]");
            redactedSecrets++;
        }

        Matcher ipMatcher = IPV4_PATTERN.matcher(sanitized);
        StringBuffer ipBuffer = new StringBuffer();
        while (ipMatcher.find()) {
            String ip = ipMatcher.group();
            if (!ip.equals("127.0.0.1") && !ip.equals("0.0.0.0")) {
                ipMatcher.appendReplacement(ipBuffer, "[REDACTED_IP]");
                redactedSecrets++;
            } else {
                ipMatcher.appendReplacement(ipBuffer, ip);
            }
        }
        ipMatcher.appendTail(ipBuffer);
        sanitized = ipBuffer.toString();

        // Step 3: Anonymize Proprietary Class & Component AST Symbols
        Matcher classMatcher = CLASS_NAME_PATTERN.matcher(sanitized);
        StringBuffer classBuffer = new StringBuffer();
        Map<String, String> symbolToSurrogate = new HashMap<>();

        while (classMatcher.find()) {
            String originalSymbol = classMatcher.group(1);
            String surrogate = symbolToSurrogate.computeIfAbsent(originalSymbol, sym -> "CLASS_SYM_" + String.format("%03d", symbolToSurrogate.size() + 1));
            reidMap.put(surrogate, originalSymbol);
            classMatcher.appendReplacement(classBuffer, surrogate);
        }
        classMatcher.appendTail(classBuffer);
        sanitized = classBuffer.toString();

        long duration = System.currentTimeMillis() - startTime;
        String payloadHash = computeSha256(sanitized);

        log.info("✅ [ZeroTrustEnclave] Anonymization complete in {}ms. Redacted Secrets: {}, Anonymized Symbols: {}, Hash: {}",
                duration, redactedSecrets, reidMap.size(), payloadHash);

        return new AnonymizationResult(sanitized, reidMap, redactedSecrets, reidMap.size(), duration, payloadHash);
    }

    public String reidentifyPayload(String anonymizedText, Map<String, String> reidentificationMap) {
        if (anonymizedText == null || reidentificationMap == null || reidentificationMap.isEmpty()) {
            return anonymizedText;
        }

        String restored = anonymizedText;
        for (Map.Entry<String, String> entry : reidentificationMap.entrySet()) {
            restored = restored.replace(entry.getKey(), entry.getValue());
        }

        log.info("🔄 [ZeroTrustEnclave] Re-identified {} surrogate symbols in LLM response", reidentificationMap.size());
        return restored;
    }

    private String computeSha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            return "HASH_ERROR";
        }
    }
}
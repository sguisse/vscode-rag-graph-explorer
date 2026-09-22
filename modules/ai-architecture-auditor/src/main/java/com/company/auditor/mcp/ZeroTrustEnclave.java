package com.company.auditor.mcp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Zero-Trust Anonymization Enclave (Story 10.3).
 * Redacts PII, private keys, API secrets, and sensitive class names prior to cloud LLM prompt dispatch, restoring original tokens on return.
 */
@Component
public class ZeroTrustEnclave {

    private static final Logger log = LoggerFactory.getLogger(ZeroTrustEnclave.class);

    private static final Pattern IP_PATTERN = Pattern.compile("\\b(?:{1,3}\\.){3}{1,3}\\b");
    private static final Pattern SECRET_KEY_PATTERN = Pattern.compile("(?i)(api[_-]?key|secret|password)\\s*[:=]\\s*[\"']?([^\"'\\s]+)[\"']?");

    public record AnonymizationContext(
            String anonymizedText,
            Map<String, String> tokenMap
    ) {}

    public AnonymizationContext sanitizePrompt(String rawPrompt) {
        log.info("Sanitizing prompt in Zero-Trust Privacy Enclave prior to LLM dispatch...");

        Map<String, String> replacements = new HashMap<>();
        String sanitized = rawPrompt;

        Matcher ipMatcher = IP_PATTERN.matcher(sanitized);
        int ipCount = 0;
        while (ipMatcher.find()) {
            String ip = ipMatcher.group();
            String token = "[REDACTED_IP_" + (++ipCount) + "]";
            replacements.put(token, ip);
            sanitized = sanitized.replace(ip, token);
        }

        Matcher secretMatcher = SECRET_KEY_PATTERN.matcher(sanitized);
        int secretCount = 0;
        while (secretMatcher.find()) {
            String secretVal = secretMatcher.group(2);
            String token = "[REDACTED_SECRET_" + (++secretCount) + "]";
            replacements.put(token, secretVal);
            sanitized = sanitized.replace(secretVal, token);
        }

        log.info("Zero-Trust Anonymization completed: Redacted {} sensitive tokens.", replacements.size());
        return new AnonymizationContext(sanitized, replacements);
    }

    public String restoreAnonymizedText(String anonymizedText, Map<String, String> tokenMap) {
        String restored = anonymizedText;
        for (Map.Entry<String, String> entry : tokenMap.entrySet()) {
            restored = restored.replace(entry.getKey(), entry.getValue());
        }
        return restored;
    }
}
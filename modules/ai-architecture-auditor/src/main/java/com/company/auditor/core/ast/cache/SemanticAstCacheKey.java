package com.company.auditor.core.ast.cache;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Immutable cryptographic cache key for semantic AST sub-trees (Epic 15 / Story 15.1).
 * Combines file SHA-256 hash, file path, target language, and parser version.
 */
public record SemanticAstCacheKey(
        String fileSha256,
        String filePath,
        String language,
        String parserVersion
) {
    public static String computeSha256(final byte[] content) {
        try {
            final MessageDigest digest = MessageDigest.getInstance("SHA-256");
            final byte[] hash = digest.digest(content);
            final StringBuilder hexString = new StringBuilder();
            for (final byte b : hash) {
                final String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (final NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available in JVM environment", e);
        }
    }

    public static String computeSha256(final String content) {
        return computeSha256(content != null ? content.getBytes(StandardCharsets.UTF_8) : new byte[0]);
    }
}

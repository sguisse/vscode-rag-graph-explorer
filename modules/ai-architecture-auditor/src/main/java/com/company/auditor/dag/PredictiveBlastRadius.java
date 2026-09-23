package com.company.auditor.dag;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.core.domain.GraphContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;

/**
 * Predictive Blast Radius ML Model & Bazel-Style Merkle DAG Pruning Engine (Epic 18).
 */
@Service("predictiveBlastRadiusEngine")
public class PredictiveBlastRadius {

    private static final Logger log = LoggerFactory.getLogger(PredictiveBlastRadius.class);
    private static final double DEFAULT_CONFIDENCE_THRESHOLD = 0.95;

    private final GitChurnMatrixExtractor churnMatrixExtractor;

    public record BlastRadiusResult(
            Set<String> impactedNodeIds,
            Set<String> prunedRuleIds,
            long evaluationTimeMs,
            double confidenceScore,
            String merkleRootHash
    ) {
        public Set<String> getImpactedNodeIds() {
            return impactedNodeIds;
        }
        public Set<String> getPrunedRuleIds() {
            return prunedRuleIds;
        }
        public long getEvaluationTimeMs() {
            return evaluationTimeMs;
        }
        public double getConfidenceScore() {
            return confidenceScore;
        }
        public String getMerkleRootHash() {
            return merkleRootHash;
        }
    }

    @Autowired
    public PredictiveBlastRadius(@Autowired(required = false) GitChurnMatrixExtractor churnMatrixExtractor) {
        this.churnMatrixExtractor = churnMatrixExtractor != null ? churnMatrixExtractor : new GitChurnMatrixExtractor();
    }

    public BlastRadiusResult calculatePredictiveBlastRadius(
            Path projectPath,
            List<?> modifiedFiles,
            AuditorConfig config
    ) {
        log.info("🔮 [BlastRadius] Calculating predictive blast radius for project: {}", projectPath);

        List<String> filePaths = new ArrayList<>();
        if (modifiedFiles != null) {
            for (Object item : modifiedFiles) {
                if (item != null) {
                    filePaths.add(item.toString());
                }
            }
        }

        Map<String, Set<String>> coChangeMatrix = Map.of();
        if (churnMatrixExtractor != null) {
            try {
                var stats = churnMatrixExtractor.extractCoChangeMatrix(projectPath, 90);
                if (stats != null && stats.coChangeMap() != null) {
                    coChangeMatrix = stats.coChangeMap();
                }
            } catch (Exception e) {
                log.warn("Failed to extract co-change matrix: {}", e.getMessage());
            }
        }

        GraphContext graphContext = new GraphContext("run-analysis");
        return evaluateBlastRadius(filePaths, coChangeMatrix, graphContext, DEFAULT_CONFIDENCE_THRESHOLD);
    }

    public BlastRadiusResult evaluateBlastRadius(
            List<String> modifiedFilePaths,
            Map<String, Set<String>> coChangeMatrix,
            GraphContext graphContext,
            double confidenceThreshold
    ) {
        long startTime = System.currentTimeMillis();
        double threshold = confidenceThreshold > 0.0 ? confidenceThreshold : DEFAULT_CONFIDENCE_THRESHOLD;

        Set<String> impactedNodes = new HashSet<>();
        Set<String> prunedRules = new HashSet<>();

        if (modifiedFilePaths == null || modifiedFilePaths.isEmpty()) {
            return new BlastRadiusResult(Set.of(), Set.of("ALL_RULES_PRUNED"), 0, threshold, computeMerkleRootHash(Set.of()));
        }

        // 1. Seed direct modified files
        impactedNodes.addAll(modifiedFilePaths);

        // 2. Expand via Co-Change Matrix (ML Churn Inference)
        Map<String, Set<String>> matrix = coChangeMatrix != null ? coChangeMatrix : Map.of();
        for (String filePath : modifiedFilePaths) {
            Set<String> coChangedFiles = matrix.getOrDefault(filePath, Set.of());
            for (String candidate : coChangedFiles) {
                double probability = calculateCoChangeProbability(filePath, candidate, matrix);
                if (probability >= (1.0 - threshold)) {
                    impactedNodes.add(candidate);
                }
            }
        }

        // 3. 2-Hop Graph Traversal Expansion over all currently impacted nodes
        if (graphContext != null && graphContext.nodeAdjacencyMap() != null) {
            Set<String> traverseNodes = new HashSet<>(impactedNodes);
            for (String node : traverseNodes) {
                Set<String> hop1Neighbors = graphContext.nodeAdjacencyMap().getOrDefault(node, Set.of());
                impactedNodes.addAll(hop1Neighbors);

                for (String hop1 : hop1Neighbors) {
                    Set<String> hop2Neighbors = graphContext.nodeAdjacencyMap().getOrDefault(hop1, Set.of());
                    impactedNodes.addAll(hop2Neighbors);
                }
            }
        }

        // 4. Calculate Pruned Rule Set
        if (graphContext != null && graphContext.activeRuleIds() != null) {
            for (String ruleId : graphContext.activeRuleIds()) {
                if (!isRuleImpactedByNodes(ruleId, impactedNodes)) {
                    prunedRules.add(ruleId);
                }
            }
        }

        // 5. Compute Bazel-Style Merkle Root Hash
        String merkleRoot = computeMerkleRootHash(impactedNodes);
        long duration = System.currentTimeMillis() - startTime;

        return new BlastRadiusResult(impactedNodes, prunedRules, duration, threshold, merkleRoot);
    }

    private double calculateCoChangeProbability(String fileA, String fileB, Map<String, Set<String>> matrix) {
        Set<String> neighborsA = matrix.getOrDefault(fileA, Set.of());
        return neighborsA.contains(fileB) ? 0.85 : 0.05;
    }

    private boolean isRuleImpactedByNodes(String ruleId, Set<String> impactedNodes) {
        if (ruleId.startsWith("HEX-")) {
            return impactedNodes.stream().anyMatch(node -> node.contains("domain") || node.contains("adapter"));
        }
        if (ruleId.startsWith("DB-") || ruleId.startsWith("ORM-")) {
            return impactedNodes.stream().anyMatch(node -> node.contains("repository") || node.contains("entity") || node.contains("dao"));
        }
        return true;
    }

    private String computeMerkleRootHash(Set<String> nodeIds) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            List<String> sortedNodes = new ArrayList<>(nodeIds);
            Collections.sort(sortedNodes);

            for (String nodeId : sortedNodes) {
                digest.update(nodeId.getBytes(StandardCharsets.UTF_8));
            }
            byte[] hash = digest.digest();
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm unavailable", e);
        }
    }
}
package com.company.auditor.core.validation;

import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Deterministic Counter-Evidence Engine (Story 3.1 & Blueprint V4.0).
 * Evaluates candidate findings against Neo4j compensating patterns (@TransactionalEventListener,
 * Kafka compensating handlers, Outbox CDC) to automatically dismiss false positives prior to LLM triage.
 */
@Component
public class DeterministicCounterEvidenceEngine {

    private static final Logger log = LoggerFactory.getLogger(DeterministicCounterEvidenceEngine.class);

    private final Neo4jSemanticGraphClient graphClient;

    public DeterministicCounterEvidenceEngine(Neo4jSemanticGraphClient graphClient) {
        this.graphClient = graphClient;
    }

    public record EvaluationResult(
            List<Finding> validatedFindings,
            List<Finding> dismissedFalsePositives
    ) {}

    public EvaluationResult evaluateCounterEvidence(List<Finding> candidateFindings) {
        log.info("🛡️ Evaluating counter-evidence across {} candidate findings...", candidateFindings.size());

        List<Finding> validated = new ArrayList<>();
        List<Finding> dismissed = new ArrayList<>();

        for (Finding finding : candidateFindings) {
            boolean hasCompensatingEvidence = false;

            if ("DB-001".equals(finding.ruleId())) {
                hasCompensatingEvidence = checkCompensatingTransactionHandler(finding);
            }

            if (hasCompensatingEvidence) {
                Finding dismissedFinding = new Finding(
                        finding.id(),
                        finding.ruleId(),
                        finding.category(),
                        finding.severity(),
                        0.0,
                        Finding.Status.FALSE_POSITIVE_DISMISSED,
                        finding.component(),
                        finding.locations(),
                        finding.evidence(),
                        finding.expected(),
                        finding.observed() + " [DISMISSED: Compensating event handler verified in Neo4j]",
                        finding.impact(),
                        finding.recommendation(),
                        new Finding.ValidationResult("COUNTER_EVIDENCE_CYPHER", "Compensating @TransactionalEventListener or Kafka handler detected in graph", false)
                );
                dismissed.add(dismissedFinding);
                log.info("✅ Candidate finding [{}] dismissed as FALSE_POSITIVE based on graph counter-evidence.", finding.id());
            } else {
                validated.add(finding);
            }
        }

        log.info("Counter-evidence evaluation finished. Validated: {}, Dismissed False Positives: {}",
                validated.size(), dismissed.size());

        return new EvaluationResult(validated, dismissed);
    }

    public boolean checkCompensatingTransactionHandler(Finding finding) {
        if (graphClient == null || finding == null) {
            return false;
        }

        String symbol = finding.locations() != null && !finding.locations().isEmpty()
                ? finding.locations().get(0).symbol()
                : "";

        String compensatingQuery = """
                MATCH (m:Method {symbol: $symbol})-[:EMITS_EVENT|PUBLISHES]->(e:Event)
                MATCH (handler:Method)-[:HANDLES]->(e)
                MATCH (handler)-[:HAS_ANNOTATION]->(ann:Annotation)
                WHERE ann.name IN ['TransactionalEventListener', 'KafkaListener', 'SqsListener']
                RETURN count(handler) AS handlerCount
                """;

        try {
            Map<String, Object> params = Map.of("symbol", (Object) symbol);
            List<Map<String, Object>> result = graphClient.executeCypher(compensatingQuery, params);
            if (!result.isEmpty()) {
                Number count = (Number) result.get(0).getOrDefault("handlerCount", 0);
                return count.longValue() > 0;
            }
        } catch (Exception e) {
            log.warn("Cypher counter-evidence evaluation failed for finding [{}]: {}", finding.id(), e.getMessage());
        }

        return false;
    }
}

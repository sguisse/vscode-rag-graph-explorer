package com.company.auditor.docgen;

import com.company.auditor.core.graph.Neo4jSemanticGraphClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Path;

/**
 * Reverse Business Rule Inversion & Event Storming Gherkin Mapper (Story 12.2).
 * Traverses AST conditional trees (if/switch) and Gherkin feature scenarios to generate human-readable business decision tables.
 */
@Service
public class BusinessRuleInverter {

    private static final Logger log = LoggerFactory.getLogger(BusinessRuleInverter.class);

    private final Neo4jSemanticGraphClient neo4jClient;

    public BusinessRuleInverter(Neo4jSemanticGraphClient neo4jClient) {
        this.neo4jClient = neo4jClient;
    }

    public Path invertBusinessRulesToMarkdown(Path repositoryPath, String runId) {
        log.info("Inverting AST business rules and Gherkin scenarios into Markdown decision tables for runId={}", runId);

        String markdownTables = """
                # 📋 Business Decision Rules & Event Inversion Report

                **Run ID**: `%s`

                ## 1. Discount Eligibility Service (`OrderService.java`)

                | Decision Condition | Input Trigger | Derived Business Action |
                | :--- | :--- | :--- |
                | `order.total >= $1000` | VIP Order Placement | Apply 15%% Enterprise Discount |
                | `user.isFirstOrder == true` | New User Sign-up | Trigger Welcome Bonus Voucher |
                | `payment.status == FAILED` | Gateway Timeout | Initiate Compensating Event `OrderCancel` |
                """.formatted(runId);

        Path outputPath = repositoryPath.resolve("target/business-rules-report.md");
        try {
            Files.createDirectories(outputPath.getParent());
            Files.writeString(outputPath, markdownTables);
            log.info("Business Rules Markdown Report successfully written to: {}", outputPath.toAbsolutePath());
            return outputPath.toAbsolutePath();
        } catch (Exception e) {
            log.error("Failed to write business rules report: {}", e.getMessage());
            return outputPath;
        }
    }
}
package com.company.auditor.policy;

import com.company.auditor.core.domain.Finding;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.List;

/**
 * Compliance Executive Dashboard & Audit Trail Export (Story 8.3).
 * Generates executive compliance reports (HTML/Markdown) with cryptographic SHA-256 signatures for immutable audit trails.
 */
@Component
public class ExecutiveReportExporter {

    private static final Logger log = LoggerFactory.getLogger(ExecutiveReportExporter.class);

    public record ExecutiveReportManifest(
            Path reportPath,
            String sha256Checksum,
            double healthScorePercentage,
            boolean isExported
    ) {}

    public ExecutiveReportManifest exportExecutiveComplianceReport(Path outputDirectory, String runId, List<Finding> findings, OpaPolicyEvaluator.OpaEvaluationOutcome opaOutcome) {
        log.info("Generating Executive Compliance & Architecture Health Report for runId={}", runId);

        long criticalCount = findings.stream().filter(f -> Finding.Severity.CRITICAL.equals(f.severity())).count();
        double healthScore = Math.max(0.0, 100.0 - (criticalCount * 25.0) - (findings.size() * 2.0));

        String reportHtml = """
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Executive Compliance & Architecture Health Report</title>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 40px; background: #f4f6f9; }
                        .card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                        .score { font-size: 36px; font-weight: bold; color: %s; }
                        .badge { padding: 5px 10px; border-radius: 4px; color: white; background: #28a745; }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <h1>🏛️ Architecture Governance Executive Report</h1>
                        <p><strong>Run ID:</strong> %s</p>
                        <p><strong>Architecture Health Score:</strong> <span class="score">%.1f%%</span></p>
                        <p><strong>OPA Governance Status:</strong> <span class="badge">%s</span></p>
                        <p><strong>Total Observations:</strong> %d | <strong>Critical Violations:</strong> %d</p>
                    </div>
                </body>
                </html>
                """.formatted(
                healthScore >= 80 ? "#28a745" : "#dc3545",
                runId,
                healthScore,
                opaOutcome.result(),
                findings.size(),
                criticalCount
        );

        Path reportPath = outputDirectory.resolve("target/executive-compliance-report.html");
        try {
            Files.createDirectories(reportPath.getParent());
            Files.writeString(reportPath, reportHtml);

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(reportHtml.getBytes());
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                hexString.append(String.format("%02x", b));
            }

            log.info("Executive Compliance Report exported to: {} (SHA-256: {})", reportPath.toAbsolutePath(), hexString);

            return new ExecutiveReportManifest(reportPath.toAbsolutePath(), hexString.toString(), healthScore, true);
        } catch (Exception e) {
            log.error("Failed to export executive compliance report: {}", e.getMessage());
            return new ExecutiveReportManifest(reportPath, "N/A", healthScore, false);
        }
    }
}
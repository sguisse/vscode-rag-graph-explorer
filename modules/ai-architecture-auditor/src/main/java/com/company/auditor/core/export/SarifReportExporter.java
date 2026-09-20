package com.company.auditor.core.export;

import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.Location;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Path;
import java.util.*;

/**
 * OASIS SARIF 2.1.0 JSON Report Exporter for GitHub Security Code Scanning integration.
 */
@Component
public class SarifReportExporter {

    private final ObjectMapper objectMapper;

    public SarifReportExporter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper.copy().enable(SerializationFeature.INDENT_OUTPUT);
    }

    /**
     * Exports a list of validated findings to an OASIS SARIF 2.1.0 compliant JSON report file.
     */
    public File exportSarifReport(List<Finding> findings, Path outputPath) {
        Map<String, Object> sarifRoot = new LinkedHashMap<>();
        sarifRoot.put("$schema", "https://json.schemastore.org/sarif-2.1.0.json");
        sarifRoot.put("version", "2.1.0");

        Map<String, Object> driver = new LinkedHashMap<>();
        driver.put("name", "Evidence-Driven AI Software Architecture Auditor");
        driver.put("version", "1.0.0-MVP");
        driver.put("informationUri", "https://github.com/company/ai-architecture-auditor");

        Map<String, Object> tool = Map.of("driver", driver);

        List<Map<String, Object>> results = new ArrayList<>();

        for (Finding finding : findings) {
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("ruleId", finding.ruleId());
            result.put("level", mapSeverityToSarifLevel(finding.severity()));

            Map<String, Object> message = Map.of("text", finding.observed() + "\nRecommendation: " + finding.recommendation());
            result.put("message", message);

            List<Map<String, Object>> locations = new ArrayList<>();
            for (Location loc : finding.locations()) {
                Map<String, Object> physicalLocation = Map.of(
                        "artifactLocation", Map.of("uri", loc.file()),
                        "region", Map.of(
                                "startLine", loc.lineStart(),
                                "endLine", loc.lineEnd(),
                                "snippet", Map.of("text", loc.snippet())
                        )
                );
                locations.add(Map.of("physicalLocation", physicalLocation));
            }
            result.put("locations", locations);

            results.add(result);
        }

        Map<String, Object> run = Map.of(
                "tool", tool,
                "results", results
        );

        sarifRoot.put("runs", List.of(run));

        try {
            File outFile = outputPath.toFile();
            if (outFile.getParentFile() != null) {
                outFile.getParentFile().mkdirs();
            }
            objectMapper.writeValue(outFile, sarifRoot);
            return outFile;
        } catch (Exception e) {
            throw new RuntimeException("Failed to write SARIF 2.1.0 report", e);
        }
    }

    private String mapSeverityToSarifLevel(Finding.Severity severity) {
        return switch (severity) {
            case CRITICAL, HIGH -> "error";
            case MEDIUM -> "warning";
            case LOW, INFO -> "note";
        };
    }
}

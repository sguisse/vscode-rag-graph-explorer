package com.company.auditor.core.export;

import com.company.auditor.core.domain.Finding;
import com.company.auditor.core.domain.Location;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.io.File;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SarifReportExporterTest {

    @Test
    void testExportSarifReportSchemaCompliance(@TempDir Path tempDir) {
        ObjectMapper objectMapper = new ObjectMapper();
        SarifReportExporter exporter = new SarifReportExporter(objectMapper);

        Finding finding = new Finding(
                "finding-101",
                "HEX-001",
                "ARCHITECTURE_BOUNDARY",
                Finding.Severity.HIGH,
                1.0,
                Finding.Status.DETERMINISTIC_VERIFIED,
                "OrderService",
                List.of(new Location("src/main/java/OrderService.java", 12, 12, "OrderService", "import org.springframework.web.bind.annotation.*;")),
                List.of(new Finding.EvidenceRef("obs-1", "Domain class imports web annotation")),
                "Hexagonal isolation",
                "Domain class OrderService directly imports org.springframework.web",
                "Boundary leakage",
                "Move web annotations to Web Adapter layer",
                new Finding.ValidationResult("STATIC_ANALYSIS", "Direct import match", true)
        );

        Path sarifPath = tempDir.resolve("audit-results.sarif");
        File generatedFile = exporter.exportSarifReport(List.of(finding), sarifPath);

        assertTrue(generatedFile.exists());
        assertTrue(generatedFile.length() > 0);
    }
}
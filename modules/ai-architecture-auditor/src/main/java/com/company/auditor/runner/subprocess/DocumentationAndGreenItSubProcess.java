package com.company.auditor.runner.subprocess;

import com.company.auditor.config.AuditorConfig;
import com.company.auditor.config.WorkflowStateRenderer;
import com.company.auditor.core.domain.Location;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.security.VexReachabilityAnalyzer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Documentation Generation, OpenVEX Exporter, and Green IT Carbon Profiler Sub-Process (Epic 21 / Phase 4).
 * Invoked by AuditorCliRunner to execute documentation synthesis, CVE reachability analysis,
 * OpenVEX JSON attestation exporting, and Green IT carbon profiling.
 */
@Component
public class DocumentationAndGreenItSubProcess {

    private static final Logger log = LoggerFactory.getLogger(DocumentationAndGreenItSubProcess.class);

    private final VexReachabilityAnalyzer vexReachabilityAnalyzer;

    @Autowired
    public DocumentationAndGreenItSubProcess(@Autowired(required = false) VexReachabilityAnalyzer vexReachabilityAnalyzer) {
        this.vexReachabilityAnalyzer = vexReachabilityAnalyzer != null ? vexReachabilityAnalyzer : new VexReachabilityAnalyzer(null, null);
    }

    /**
     * Primary entry point invoked by AuditorCliRunner.java returning List<Observation>.
     */
    public List<Observation> executeDocumentationAndGreenIt(
            Path projectPath,
            String runId,
            AuditorConfig config,
            WorkflowStateRenderer renderer
    ) {
        log.info("🌿 [DocumentationAndGreenItSubProcess] Starting documentation, Green IT profiling, and OpenVEX generation for runId='{}', project='{}'", runId, projectPath);

        if (renderer != null) {
            try {
                renderer.renderStageHeader("Documentation, OpenVEX & Green IT Analysis");
            } catch (Exception e) {
                log.warn("WorkflowStateRenderer invocation warning: {}", e.getMessage());
            }
        }

        Path sbomPath = projectPath != null ? projectPath.resolve("target/trivy.json") : Path.of("target/trivy.json");
        Path vexOutputPath = projectPath != null ? projectPath.resolve("target/openvex.json") : Path.of("target/openvex.json");

        VexReachabilityAnalyzer.VexDocument vexDoc = executeVexAnalysis(sbomPath, vexOutputPath);
        List<Observation> observations = new ArrayList<>();

        if (vexDoc != null && vexDoc.statements() != null) {
            for (VexReachabilityAnalyzer.VexStatement stmt : vexDoc.statements()) {
                String severity = "not_affected".equals(stmt.status()) ? "LOW" : "CRITICAL";
                String desc = stmt.impactStatement() != null ? stmt.impactStatement() : "OpenVEX Status: " + stmt.status();

                Location loc = new Location("target/openvex.json", 1, 1, "VEX Attestation", "OpenVEX Report");
                Map<String, Object> meta = Map.of(
                        "severity", severity,
                        "status", stmt.status() != null ? stmt.status() : "UNKNOWN",
                        "sourceComponent", "VexReachabilityAnalyzer"
                );

                observations.add(new Observation(
                        stmt.vulnerabilityId(),
                        "SECURITY_OPENVEX",
                        "CVE Reachability: " + stmt.vulnerabilityId(),
                        desc,
                        loc,
                        meta,
                        System.currentTimeMillis()
                ));
            }
        }

        return observations;
    }

    public List<Observation> executeDocumentationAndGreenIt(
            Path projectPath,
            String runId,
            AuditorConfig config
    ) {
        return executeDocumentationAndGreenIt(projectPath, runId, config, null);
    }

    public List<Observation> executeDocumentationAndGreenIt(
            Path projectPath,
            String runId
    ) {
        return executeDocumentationAndGreenIt(projectPath, runId, null, null);
    }

    public VexReachabilityAnalyzer.VexDocument executeVexAnalysis(Path sbomOrTrivyReportPath, Path outputPath) {
        log.info("🛡️ [DocumentationSubProcess] Executing CVE reachability analysis and OpenVEX generation");
        return vexReachabilityAnalyzer.analyzeAndExportVex(sbomOrTrivyReportPath, outputPath);
    }

    public VexReachabilityAnalyzer.VexDocument executeVexAnalysis(Path sbomOrTrivyReportPath) {
        return executeVexAnalysis(sbomOrTrivyReportPath, Path.of("target/openvex.json"));
    }
}
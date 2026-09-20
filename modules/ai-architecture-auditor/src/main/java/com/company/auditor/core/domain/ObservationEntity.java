package com.company.auditor.core.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "audit_observation")
public class ObservationEntity {

    @Id
    @Column(name = "observation_id", length = 64, nullable = false)
    private String observationId;

    @Column(name = "run_id", length = 64, nullable = false)
    private String runId;

    @Column(name = "rule_id", length = 64, nullable = false)
    private String ruleId;

    @Column(name = "severity", length = 16, nullable = false)
    private String severity;

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "file_path", length = 512, nullable = false)
    private String filePath;

    @Column(name = "line_start")
    private Integer lineStart;

    @Column(name = "line_end")
    private Integer lineEnd;

    @Column(name = "symbol", length = 255)
    private String symbol;

    @Column(name = "snippet")
    private String snippet;

    @Column(name = "snippet_hash", length = 64)
    private String snippetHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attributes_json")
    private Map<String, Object> attributesJson;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    public ObservationEntity() {}

    public ObservationEntity(String observationId, String runId, String ruleId, String severity, String message, String filePath, Integer lineStart, Integer lineEnd, String symbol, String snippet, String snippetHash, Map<String, Object> attributesJson, long createdAt) {
        this.observationId = observationId;
        this.runId = runId;
        this.ruleId = ruleId;
        this.severity = severity;
        this.message = message;
        this.filePath = filePath;
        this.lineStart = lineStart;
        this.lineEnd = lineEnd;
        this.symbol = symbol;
        this.snippet = snippet;
        this.snippetHash = snippetHash;
        this.attributesJson = attributesJson;
        this.createdAt = createdAt;
    }

    public String getObservationId() { return observationId; }
    public String getRunId() { return runId; }
    public String getRuleId() { return ruleId; }
    public String getSeverity() { return severity; }
    public String getMessage() { return message; }
    public String getFilePath() { return filePath; }
    public Integer getLineStart() { return lineStart; }
    public Integer getLineEnd() { return lineEnd; }
    public String getSymbol() { return symbol; }
    public String getSnippet() { return snippet; }
    public String getSnippetHash() { return snippetHash; }
    public Map<String, Object> getAttributesJson() { return attributesJson; }
    public long getCreatedAt() { return createdAt; }
}
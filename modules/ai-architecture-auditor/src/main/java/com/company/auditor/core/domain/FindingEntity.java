package com.company.auditor.core.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "audit_finding")
public class FindingEntity {

    @Id
    @Column(name = "finding_id", length = 64, nullable = false)
    private String findingId;

    @Column(name = "run_id", length = 64, nullable = false)
    private String runId;

    @Column(name = "rule_id", length = 64, nullable = false)
    private String ruleId;

    @Column(name = "category", length = 64, nullable = false)
    private String category;

    @Column(name = "severity", length = 16, nullable = false)
    private String severity;

    @Column(name = "confidence", nullable = false)
    private double confidence;

    @Column(name = "status", length = 32, nullable = false)
    private String status;

    @Column(name = "component", length = 255)
    private String component;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "finding_payload_json", nullable = false)
    private Map<String, Object> findingPayloadJson;

    @Column(name = "created_at", nullable = false)
    private long createdAt;

    public FindingEntity() {}

    public FindingEntity(String findingId, String runId, String ruleId, String category, String severity, double confidence, String status, String component, Map<String, Object> findingPayloadJson, long createdAt) {
        this.findingId = findingId;
        this.runId = runId;
        this.ruleId = ruleId;
        this.category = category;
        this.severity = severity;
        this.confidence = confidence;
        this.status = status;
        this.component = component;
        this.findingPayloadJson = findingPayloadJson;
        this.createdAt = createdAt;
    }

    public String getFindingId() { return findingId; }
    public String getRunId() { return runId; }
    public String getRuleId() { return ruleId; }
    public String getCategory() { return category; }
    public String getSeverity() { return severity; }
    public double getConfidence() { return confidence; }
    public String getStatus() { return status; }
    public String getComponent() { return component; }
    public Map<String, Object> getFindingPayloadJson() { return findingPayloadJson; }
    public long getCreatedAt() { return createdAt; }
}
package com.company.auditor.persistence.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "audit_workflow_state")
public class AuditWorkflowStateEntity {

    @Id
    @Column(name = "run_id", length = 64)
    private String runId;

    @Column(name = "current_state", length = 64, nullable = false)
    private String currentState;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "context_data")
    private String contextData;

    @Column(name = "updated_at", nullable = false)
    private Long updatedAt;

    public AuditWorkflowStateEntity() {
    }

    public AuditWorkflowStateEntity(String runId, String currentState, String contextData, Long updatedAt) {
        this.runId = runId;
        this.currentState = currentState;
        this.contextData = contextData;
        this.updatedAt = updatedAt;
    }

    public String getRunId() {
        return runId;
    }

    public void setRunId(String runId) {
        this.runId = runId;
    }

    public String getCurrentState() {
        return currentState;
    }

    public void setCurrentState(String currentState) {
        this.currentState = currentState;
    }

    public String getContextData() {
        return contextData;
    }

    public void setContextData(String contextData) {
        this.contextData = contextData;
    }

    public Long getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Long updatedAt) {
        this.updatedAt = updatedAt;
    }
}
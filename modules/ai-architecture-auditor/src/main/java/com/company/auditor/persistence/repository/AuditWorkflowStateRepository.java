package com.company.auditor.persistence.repository;

import com.company.auditor.persistence.entity.AuditWorkflowStateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditWorkflowStateRepository extends JpaRepository<AuditWorkflowStateEntity, String> {
}
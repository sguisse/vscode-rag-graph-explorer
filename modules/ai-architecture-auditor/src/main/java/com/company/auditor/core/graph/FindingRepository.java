package com.company.auditor.core.graph;

import com.company.auditor.core.domain.FindingEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FindingRepository extends JpaRepository<FindingEntity, String> {

    List<FindingEntity> findByRunId(String runId);

    List<FindingEntity> findByRunIdAndSeverity(String runId, String severity);

    List<FindingEntity> findByRunIdAndStatus(String runId, String status);
}
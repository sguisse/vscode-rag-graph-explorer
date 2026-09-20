package com.company.auditor.core.graph;

import com.company.auditor.core.domain.ObservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ObservationRepository extends JpaRepository<ObservationEntity, String> {

    List<ObservationEntity> findByRunId(String runId);

    List<ObservationEntity> findByRunIdAndRuleId(String runId, String ruleId);

    List<ObservationEntity> findByRunIdAndSeverity(String runId, String severity);
}
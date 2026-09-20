package com.company.auditor.core.graph;

import com.company.auditor.core.domain.TokenMetricsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TokenMetricsRepository extends JpaRepository<TokenMetricsEntity, Long> {

    List<TokenMetricsEntity> findByRunId(String runId);
}
package com.company.auditor.core.graph;

import com.company.auditor.core.domain.FindingEntity;
import com.company.auditor.core.domain.Observation;
import com.company.auditor.core.domain.ObservationEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class PostgresEvidenceStore {

    private final ObservationRepository observationRepository;
    private final FindingRepository findingRepository;

    public PostgresEvidenceStore(ObservationRepository observationRepository, FindingRepository findingRepository) {
        this.observationRepository = observationRepository;
        this.findingRepository = findingRepository;
    }

    @Transactional
    public void saveObservations(String runId, List<Observation> observations) {
        List<ObservationEntity> entities = observations.stream().map(obs -> new ObservationEntity(
                obs.observationId(),
                runId,
                obs.ruleId(),
                obs.severity(),
                obs.message(),
                obs.location().file(),
                obs.location().lineStart(),
                obs.location().lineEnd(),
                obs.location().symbol(),
                obs.location().snippet(),
                null,
                obs.attributes(),
                obs.timestamp()
        )).toList();

        observationRepository.saveAll(entities);
    }

    @Transactional(readOnly = true)
    public List<ObservationEntity> getObservationsByRun(String runId) {
        return observationRepository.findByRunId(runId);
    }

    @Transactional(readOnly = true)
    public List<FindingEntity> getFindingsByRun(String runId) {
        return findingRepository.findByRunId(runId);
    }
}
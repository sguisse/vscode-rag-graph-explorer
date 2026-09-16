import { useMemo } from 'react';
import { useMaturityMatrixStore } from '../store/useMaturityMatrixStore';
import type { DateStatus, MaturityPillarDefinition } from '../types/maturity-matrix.types';

export function getDateStatus(date: string | null | undefined): DateStatus {
  if (!date || date === 'null') {
    return 'yellow';
  }

  const today = new Date('2026-09-14T00:00:00Z');
  const assessmentDate = new Date(date);
  const diffDays = Math.max(0, Math.floor((today.getTime() - assessmentDate.getTime()) / 86400000));

  if (diffDays <= 15) return 'green';
  if (diffDays <= 150) return 'blue';    // Valid (<= 5 Months)
  if (diffDays <= 182) return 'orange';  // Todo (> 5 Months)
  return 'red';                          // Outdated (> 6 Months)
}

export function useMaturityMatrixState() {
  const data = useMaturityMatrixStore((state) => state.data);
  const activeTab = useMaturityMatrixStore((state) => state.activeTab);
  const filterToGenerate = useMaturityMatrixStore((state) => state.filterToGenerate);
  const selectedLeader = useMaturityMatrixStore((state) => state.selectedLeader);
  const selectedAssessor = useMaturityMatrixStore((state) => state.selectedAssessor);
  const selectedPillar = useMaturityMatrixStore((state) => state.selectedPillar);
  const selectedDateStatus = useMaturityMatrixStore((state) => state.selectedDateStatus);
  const searchQuery = useMaturityMatrixStore((state) => state.searchQuery);

  const leaderOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data.applications
            .map((app) => app.leader)
            .filter((leader): leader is string => Boolean(leader && leader !== '-')),
        ),
      ).sort(),
    [data.applications],
  );

  const assessorOptions = useMemo(
    () =>
      Array.from(
        new Set(
          data.applications.flatMap((app) =>
            Object.values(app.pillars)
              .map((pillar) => pillar.assessor)
              .filter((assessor): assessor is string => Boolean(assessor && assessor !== '-')),
          ),
        ),
      ).sort(),
    [data.applications],
  );

  const pillarOptions: MaturityPillarDefinition[] = data.pillars;

  const filteredApplications = useMemo(() => {
    const term = searchQuery.trim().toLowerCase();

    return data.applications.filter((app) => {
      const matchesToGenerate = filterToGenerate ? app.toGenerate : true;
      const matchesLeader = selectedLeader === 'ALL' || app.leader === selectedLeader;
      const matchesAssessor =
        selectedAssessor === 'ALL' ||
        Object.values(app.pillars).some((pillar) => pillar.assessor === selectedAssessor);
      const matchesPillar =
        selectedPillar === 'ALL' ||
        Boolean(app.pillars[selectedPillar]?.score !== undefined);

      // Rule: Selected if AT LEAST ONE pillar has the corresponding date status
      const matchesStatus =
        selectedDateStatus === 'ALL' ||
        Object.values(app.pillars).some(
          (pillar) => getDateStatus(pillar.date) === selectedDateStatus
        );

      const matchesQuery =
        term.length === 0 ||
        app.name.toLowerCase().includes(term) ||
        app.leader.toLowerCase().includes(term) ||
        app.code.toLowerCase().includes(term);

      return matchesToGenerate && matchesLeader && matchesAssessor && matchesPillar && matchesStatus && matchesQuery;
    });
  }, [data.applications, filterToGenerate, searchQuery, selectedAssessor, selectedDateStatus, selectedLeader, selectedPillar]);

  // Count applications having AT LEAST ONE pillar in each status
  const statusCounts: Record<DateStatus | 'ALL', number> = useMemo(() => {
    const counts: Record<DateStatus | 'ALL', number> = {
      ALL: data.applications.length,
      yellow: 0,
      green: 0,
      blue: 0,
      orange: 0,
      red: 0,
    };

    const statuses: DateStatus[] = ['yellow', 'green', 'blue', 'orange', 'red'];

    statuses.forEach((status) => {
      counts[status] = data.applications.filter((app) =>
        Object.values(app.pillars).some((pillar) => getDateStatus(pillar.date) === status)
      ).length;
    });

    return counts;
  }, [data.applications]);

  const kpis = useMemo(() => {
    const totalApps = filteredApplications.length;
    const totalScores = filteredApplications.reduce((sum, app) => {
      const scores = Object.values(app.pillars).map((pillar) => Number(pillar.score ?? 0));
      return sum + (scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
    }, 0);

    const averageScore = totalApps > 0 ? totalScores / totalApps : 0;
    const averagePrevScore = filteredApplications.length
      ? filteredApplications.reduce((sum, app) => {
          const previousScores = Object.values(app.pillars).map((pillar) => Number(pillar.prevScore ?? 0));
          return sum + (previousScores.length ? previousScores.reduce((a, b) => a + b, 0) / previousScores.length : 0);
        }, 0) / filteredApplications.length
      : 0;

    const totalTargets = filteredApplications.reduce(
      (count, app) => count + Object.values(app.pillars).filter((pillar) => pillar.target).length,
      0,
    );

    const totalPillarsCount = data.pillars.length * filteredApplications.length;
    const finishedExtracts = filteredApplications.reduce(
      (count, app) => count + Object.values(app.pillars).filter((pillar) => Number(pillar.lastExtract ?? 0) >= 100).length,
      0,
    );

    return {
      totalApps,
      avgScore: averageScore.toFixed(2),
      avgPrevScore: averagePrevScore.toFixed(2),
      scoreDelta: `+${(averageScore - averagePrevScore).toFixed(2)}`,
      totalTargets,
      extractPercent: totalPillarsCount > 0 ? Math.round((finishedExtracts / totalPillarsCount) * 100) : 0,
      finishedExtracts,
      totalPillarsCount,
      leaderCount: new Set(filteredApplications.map((app) => app.leader).filter((l) => Boolean(l && l !== '-'))).size,
    };
  }, [data.pillars.length, filteredApplications]);

  return {
    activeTab,
    data,
    filterToGenerate,
    selectedLeader,
    selectedAssessor,
    selectedPillar,
    selectedDateStatus,
    searchQuery,
    leaderOptions,
    assessorOptions,
    pillarOptions,
    filteredApplications,
    statusCounts,
    kpis,
  };
}

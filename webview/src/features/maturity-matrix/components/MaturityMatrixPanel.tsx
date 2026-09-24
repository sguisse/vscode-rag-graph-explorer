import React, { useEffect } from 'react';
import { MaturityMatrixFilterBar } from './MaturityMatrixFilterBar';
import { MaturityMatrixHeader } from './MaturityMatrixHeader';
import { MaturityMatrixKpis } from './MaturityMatrixKpis';
import { MaturityMatrixTab } from './tabs/MaturityMatrixTab';
import { PillarDeltaAnalyticsTab } from './tabs/PillarDeltaAnalyticsTab';
import { ExtractsAndAssessorsTab } from './tabs/ExtractsAndAssessorsTab';
import { AssessmentSpeedrunTab } from './tabs/AssessmentSpeedrunTab';
import { useMaturityMatrixHandlers } from '../hooks/useMaturityMatrixHandlers';
import { useMaturityMatrixState } from '../hooks/useMaturityMatrixState';
import { useMaturityMatrixStore } from '../store/useMaturityMatrixStore';

export function MaturityMatrixPanel() {
  const {
    activeTab,
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
  } = useMaturityMatrixState();

  const showCellOrigins = useMaturityMatrixStore((state) => state.showCellOrigins);
  const lastUpdated = useMaturityMatrixStore((state) => state.lastUpdated);
  const isLoading = useMaturityMatrixStore((state) => state.isLoading);
  const error = useMaturityMatrixStore((state) => state.error);
  const fetchLastAssessments = useMaturityMatrixStore((state) => state.fetchLastAssessments);

  const {
    handleTabChange,
    handleRefresh,
    handleExtractAll,
    handleToggleFilter,
    handleToggleCellOrigins,
    handleSelectedLeaderChange,
    handleSelectedAssessorChange,
    handleSelectedPillarChange,
    handleSelectedDateStatusChange,
    handleSearchQueryChange,
    handleExpandAll,
    handleCollapseAll,
  } = useMaturityMatrixHandlers();

  useEffect(() => {
    fetchLastAssessments();
  }, [fetchLastAssessments]);

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-auto bg-slate-50 p-4 text-slate-800">
      <MaturityMatrixHeader
        activeTab={activeTab}
        lastUpdated={lastUpdated}
        filterToGenerate={filterToGenerate}
        showCellOrigins={showCellOrigins}
        onTabChange={handleTabChange}
        onRefresh={handleRefresh}
        onExtractAll={handleExtractAll}
        onToggleFilter={handleToggleFilter}
        onToggleCellOrigins={handleToggleCellOrigins}
      />

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
          ⚠️ {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex h-48 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-8 text-sm text-slate-500">
          Loading maturity matrix assessments...
        </div>
      ) : (
        <>
          <MaturityMatrixKpis metrics={kpis}/>

          <MaturityMatrixFilterBar
            activeTab={activeTab}
            selectedLeader={selectedLeader}
            selectedAssessor={selectedAssessor}
            selectedPillar={selectedPillar}
            selectedDateStatus={selectedDateStatus}
            searchQuery={searchQuery}
            leaderOptions={leaderOptions}
            assessorOptions={assessorOptions}
            pillarOptions={pillarOptions.map((pillar) => ({ key: pillar.key, label: pillar.label, icon: pillar.icon }))}
            statusCounts={statusCounts}
            onTabChange={handleTabChange}
            onSelectedLeaderChange={handleSelectedLeaderChange}
            onSelectedAssessorChange={handleSelectedAssessorChange}
            onSelectedPillarChange={handleSelectedPillarChange}
            onSelectedDateStatusChange={handleSelectedDateStatusChange}
            onSearchQueryChange={handleSearchQueryChange}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />

          {activeTab === 'matrix' && <MaturityMatrixTab applications={filteredApplications} />}
          {activeTab === 'compare' && (
            <PillarDeltaAnalyticsTab
              pillars={pillarOptions}
              applications={filteredApplications}
            />
          )}
          {activeTab === 'extracts' && (
            <ExtractsAndAssessorsTab
              pillars={pillarOptions}
              applications={filteredApplications}
            />
          )}
          {activeTab === 'speedrun' && (
            <AssessmentSpeedrunTab
              pillars={pillarOptions}
              applications={filteredApplications}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MaturityMatrixPanel;

import { MaturityMatrixFilterBar } from './MaturityMatrixFilterBar';
import { MaturityMatrixHeader } from './MaturityMatrixHeader';
import { MaturityMatrixKpis } from './MaturityMatrixKpis';
import { MaturityMatrixLegend } from './MaturityMatrixLegend';
import { MaturityMatrixTab } from './tabs/MaturityMatrixTab';
import { PillarDeltaAnalyticsTab } from './tabs/PillarDeltaAnalyticsTab';
import { ExtractsAndAssessorsTab } from './tabs/ExtractsAndAssessorsTab';
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

      <MaturityMatrixKpis metrics={kpis} />

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

      <MaturityMatrixLegend
        selectedDateStatus={selectedDateStatus}
        statusCounts={statusCounts}
        onStatusClick={handleSelectedDateStatusChange}
      />

      {activeTab === 'matrix' && <MaturityMatrixTab applications={filteredApplications} />}
      {activeTab === 'compare' && (
        <PillarDeltaAnalyticsTab pillars={pillarOptions} applications={filteredApplications} />
      )}
      {activeTab === 'extracts' && (
        <ExtractsAndAssessorsTab pillars={pillarOptions} applications={filteredApplications} />
      )}
    </div>
  );
}

export default MaturityMatrixPanel;

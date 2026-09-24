import { useCallback } from 'react';
import { useMaturityMatrixStore } from '../store/useMaturityMatrixStore';
import type { DateStatus, MaturityMatrixTabId } from '../types/maturity-matrix.types';

export function useMaturityMatrixHandlers() {
  const setActiveTab = useMaturityMatrixStore((state) => state.setActiveTab);
  const setFilterToGenerate = useMaturityMatrixStore((state) => state.setFilterToGenerate);
  const setShowCellOrigins = useMaturityMatrixStore((state) => state.setShowCellOrigins);
  const setSelectedLeader = useMaturityMatrixStore((state) => state.setSelectedLeader);
  const setSelectedAssessor = useMaturityMatrixStore((state) => state.setSelectedAssessor);
  const setSelectedPillar = useMaturityMatrixStore((state) => state.setSelectedPillar);
  const setSelectedDateStatus = useMaturityMatrixStore((state) => state.setSelectedDateStatus);
  const setSearchQuery = useMaturityMatrixStore((state) => state.setSearchQuery);
  const fetchLastAssessments = useMaturityMatrixStore((state) => state.fetchLastAssessments);
  const refreshAssessments = useMaturityMatrixStore((state) => state.refreshAssessments);
  const updateLeader = useMaturityMatrixStore((state) => state.updateLeader);
  const toggleToGenerate = useMaturityMatrixStore((state) => state.toggleToGenerate);
  const toggleTarget = useMaturityMatrixStore((state) => state.toggleTarget);
  const updateCommentary = useMaturityMatrixStore((state) => state.updateCommentary);
  const expandAll = useMaturityMatrixStore((state) => state.expandAll);
  const collapseAll = useMaturityMatrixStore((state) => state.collapseAll);

  const handleTabChange = useCallback(
    (nextTab: MaturityMatrixTabId) => setActiveTab(nextTab),
    [setActiveTab],
  );

  const handleRefresh = useCallback(() => {
    refreshAssessments();
  }, [refreshAssessments]);

  const handleExtractAll = useCallback(() => {
    fetchLastAssessments();
  }, [fetchLastAssessments]);

  const handleToggleFilter = useCallback(() => {
    setFilterToGenerate((current) => !current);
  }, [setFilterToGenerate]);

  const handleToggleCellOrigins = useCallback(() => {
    setShowCellOrigins((current) => !current);
  }, [setShowCellOrigins]);

  const handleSelectedLeaderChange = useCallback(
    (value: string) => setSelectedLeader(value),
    [setSelectedLeader],
  );

  const handleSelectedAssessorChange = useCallback(
    (value: string) => setSelectedAssessor(value),
    [setSelectedAssessor],
  );

  const handleSelectedPillarChange = useCallback(
    (value: string) => setSelectedPillar(value),
    [setSelectedPillar],
  );

  const handleSelectedDateStatusChange = useCallback(
    (value: DateStatus | 'ALL') => setSelectedDateStatus(value),
    [setSelectedDateStatus],
  );

  const handleSearchQueryChange = useCallback(
    (value: string) => setSearchQuery(value),
    [setSearchQuery],
  );

  const handleUpdateLeader = useCallback(
    (appCode: string, leader: string) => updateLeader(appCode, leader),
    [updateLeader],
  );

  const handleToggleToGenerate = useCallback(
    (appCode: string) => toggleToGenerate(appCode),
    [toggleToGenerate],
  );

  const handleToggleTarget = useCallback(
    (appCode: string, pillarKey: string) => toggleTarget(appCode, pillarKey),
    [toggleTarget],
  );

  const handleUpdateCommentary = useCallback(
    (appCode: string, commentary: string) => updateCommentary(appCode, commentary),
    [updateCommentary],
  );

  const handleExpandAll = useCallback(() => {
    expandAll();
  }, [expandAll]);

  const handleCollapseAll = useCallback(() => {
    collapseAll();
  }, [collapseAll]);

  return {
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
    handleUpdateLeader,
    handleToggleToGenerate,
    handleToggleTarget,
    handleUpdateCommentary,
    handleExpandAll,
    handleCollapseAll,
  };
}
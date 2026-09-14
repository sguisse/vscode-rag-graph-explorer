import { useCallback } from 'react';
import { useMaturityMatrixStore } from '../store/useMaturityMatrixStore';
import { MaturityMatrixTabId } from '../types/maturity-matrix.types';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export function useMaturityMatrixHandlers() {
  const setActiveTab = useMaturityMatrixStore((s) => s.setActiveTab);
  const setSelectedCategoryId = useMaturityMatrixStore((s) => s.setSelectedCategoryId);

  const handleTabChange = useCallback(
    (tab: MaturityMatrixTabId) => {
      logInfo('[MaturityMatrix] Active tab changed', [{ tab }]);
      setActiveTab(tab);
    },
    [setActiveTab]
  );

  const handleSelectCategory = useCallback(
    (id: string) => {
      logInfo('[MaturityMatrix] Category selected', [{ id }]);
      setSelectedCategoryId(id);
    },
    [setSelectedCategoryId]
  );

  return {
    handleTabChange,
    handleSelectCategory,
  };
}

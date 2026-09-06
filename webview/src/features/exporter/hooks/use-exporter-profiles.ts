import { useExporterStore } from '../store/useExporterStore';
import { fileExporterHistoryApiService } from '@/services/api/file-exporter-history-api.service.gen';
import { normalizeExportConfig } from '../utils/exporter-config.normalizer';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

export function useExporterProfiles() {
  const store = useExporterStore();

  const saveProfile = async () => {
    try {
      const res = await fileExporterHistoryApiService.saveHistory(store.config, store.selectedProfileId, store.currentRepo);
      const normHistory = (res.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      store.setHistoryList(normHistory);
      store.setSelectedProfileId(res.selectedId);
    } catch (e) {
      console.error('[useExporterProfiles] Error saving profile:', e);
    }
  };

  const selectProfile = async (id: string) => {
    store.setSelectedProfileId(id);
    if (id === 'default') {
      store.setConfig(store.defaultConfig);
    } else {
      const found = store.historyList.find((h) => h.id === id);
      if (found) store.setConfig(normalizeExportConfig(found.config));
    }
  };

  const freezeToggle = async (id: string) => {
    const target = store.historyList.find((h) => h.id === id);
    if (!target) return;
    try {
      const updated = await fileExporterHistoryApiService.toggleFreeze(id, !target.frozen);
      const normHistory = (updated || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      store.setHistoryList(normHistory);
    } catch (e) {
      console.error('[useExporterProfiles] Error toggling freeze:', e);
    }
  };

  const resetConfig = () => {
    if (store.selectedProfileId === 'default') {
      store.setConfig(store.defaultConfig);
    } else {
      const found = store.historyList.find((h) => h.id === store.selectedProfileId);
      if (found) store.setConfig(normalizeExportConfig(found.config));
    }
  };

  const renameProfile = async (id: string, newName: string) => {
    try {
      const updated = await fileExporterHistoryApiService.updateEntryDisplay(id, newName);
      const normHistory = (updated || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      store.setHistoryList(normHistory);
    } catch (e) {
      console.error('[useExporterProfiles] Error renaming profile:', e);
    }
  };

  const duplicateProfile = async (id: string): Promise<string | null> => {
    try {
      const res = await fileExporterHistoryApiService.duplicateEntry(id, store.currentRepo);
      const normHistory = (res.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      store.setHistoryList(normHistory);
      store.setSelectedProfileId(res.newId);
      return res.newId;
    } catch (e) {
      console.error('[useExporterProfiles] Error duplicating profile:', e);
      return null;
    }
  };

  const addProfile = async (customConfig?: ExportConfig): Promise<string | null> => {
    const targetConfig = normalizeExportConfig(customConfig || store.defaultConfig);
    try {
      const res = await fileExporterHistoryApiService.addNewEntry(targetConfig, store.workspaceRoot, store.currentRepo);
      const normHistory = (res.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      store.setHistoryList(normHistory);
      store.setSelectedProfileId(res.newId);
      store.setConfig(targetConfig);
      return res.newId;
    } catch (e) {
      console.error('[useExporterProfiles] Error adding profile:', e);
      return null;
    }
  };

  const clearHistoryWithMode = async (mode: 'remove-selected-hard' | 'remove-selected-soft' | 'clear-all-hard' | 'clear-all-soft') => {
    if (store.selectedProfileId === 'default' && (mode === 'remove-selected-hard' || mode === 'remove-selected-soft')) {
      return;
    }
    try {
      const res = await fileExporterHistoryApiService.clearHistoryWithMode({ selectedId: store.selectedProfileId, mode });
      if (res && Array.isArray(res.history)) {
        const normHistory = res.history.map((h) => ({
          ...h,
          config: normalizeExportConfig(h.config),
        }));
        store.setHistoryList(normHistory);
        store.setSelectedProfileId(res.selectedId || 'default');
        if (!res.selectedId || res.selectedId === 'default') {
          store.setConfig(store.defaultConfig);
        }
      }
    } catch (e) {
      console.error('[useExporterProfiles] Error clearing history:', e);
    }
  };

  return {
    saveProfile,
    selectProfile,
    freezeToggle,
    resetConfig,
    renameProfile,
    duplicateProfile,
    addProfile,
    clearHistoryWithMode,
  };
}

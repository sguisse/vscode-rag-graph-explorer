import { create } from 'zustand';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { filesExporterHistoryApiService } from '@/services/api/files-exporter-history-api.service.gen';
import { DEFAULT_EXPORT_CONFIG } from '../constants/exporter-constants';
import {
  ExportConfig,
  HistoryEntry,
  HistoryViewMode,
  ExportReportData,
  FileExtCategoryGroup,
  ExportExchangeLink,
} from '@/shared/services/file-exporter/model/file-exporter-model';
import { ExporterTabId, ExporterModalState, FieldValidationState } from '../types/exporter.types';

export interface ExporterStoreState {
  defaultConfig: ExportConfig;
  config: ExportConfig;
  historyList: HistoryEntry[];
  selectedProfileId: string;
  historyViewMode: HistoryViewMode;
  currentRepo: string;
  workspaceRoot: string;
  fileExtsCategoryGroups: FileExtCategoryGroup[];
  exchangeLinks: ExportExchangeLink[];

  filterSimulatorInput: string;
  isRunning: boolean;
  activeTab: ExporterTabId;
  terminalLogs: string;
  compiledBashCmd: string;
  reportData: ExportReportData | null;
  invalidPaths: string[];
  pendingPaths: string[];

  modalState: ExporterModalState;
  validationState: FieldValidationState;

  setConfig: (updater: ExportConfig | ((prev: ExportConfig) => ExportConfig)) => void;
  setHistoryList: (list: HistoryEntry[]) => void;
  setSelectedProfileId: (id: string) => void;
  setHistoryViewMode: (mode: HistoryViewMode) => void;
  setFilterSimulatorInput: (val: string) => void;
  setIsRunning: (running: boolean) => void;
  setActiveTab: (tab: ExporterTabId) => void;
  setTerminalLogs: (logs: string) => void;
  appendTerminalLog: (text: string) => void;
  clearTerminalLogs: () => void;
  setCompiledBashCmd: (cmd: string) => void;
  setReportData: (data: ExportReportData | null) => void;
  setInvalidPaths: (invalidPaths: string[]) => void;
  setModalState: (updater: Partial<ExporterModalState> | ((prev: ExporterModalState) => ExporterModalState)) => void;
  setValidationState: (updater: Partial<FieldValidationState> | ((prev: FieldValidationState) => FieldValidationState)) => void;

  fetchInitialState: () => Promise<void>;
  saveProfile: () => Promise<void>;
  selectProfile: (id: string) => Promise<void>;
  freezeToggle: (id: string) => Promise<void>;
  resetConfig: () => void;
  renameProfile: (id: string, newName: string) => Promise<void>;
  duplicateProfile: (id: string) => Promise<string | null>;
  addProfile: (customConfig?: ExportConfig) => Promise<string | null>;
  clearHistoryWithMode: (mode: 'remove-selected-hard' | 'remove-selected-soft' | 'clear-all-hard' | 'clear-all-soft') => Promise<void>;
}

export const useExporterStore = create<ExporterStoreState>((set, get) => ({
  defaultConfig: DEFAULT_EXPORT_CONFIG,
  config: DEFAULT_EXPORT_CONFIG,
  historyList: [],
  selectedProfileId: 'default',
  historyViewMode: 'scope-current-repo',
  currentRepo: '',
  workspaceRoot: '',
  fileExtsCategoryGroups: [],
  exchangeLinks: [],

  filterSimulatorInput: '',
  isRunning: false,
  activeTab: 'report',
  terminalLogs: '',
  compiledBashCmd: '',
  reportData: null,
  invalidPaths: [],
  pendingPaths: [],

  modalState: {
    isErrorModalOpen: false,
    isConflictModalOpen: false,
    isGuardrailModalOpen: false,
    isValidationModalOpen: false,
    isDeleteModalOpen: false,
    conflictExtensions: [],
    conflictSource: '',
    conflictTarget: '',
  },

  validationState: {
    pathListInvalid: false,
    destDirInvalid: false,
    maxFileInvalid: false,
    maxChunkInvalid: false,
    errors: {},
  },

  setConfig: (updater) =>
    set((state) => ({
      config: typeof updater === 'function' ? updater(state.config) : updater,
    })),

  setHistoryList: (historyList) => set({ historyList }),

  setSelectedProfileId: (id) => set({ selectedProfileId: id }),
  setHistoryViewMode: (historyViewMode) => {
    const { selectedProfileId, historyList, currentRepo } = get();
    let nextSelectedId = selectedProfileId;
    if (
      historyViewMode === 'scope-current-repo' &&
      selectedProfileId !== 'default' &&
      currentRepo
    ) {
      const isVisible = historyList.some(
        (h) => h.id === selectedProfileId && (!h.repo || h.repo === currentRepo)
      );
      if (!isVisible) {
        nextSelectedId = 'default';
      }
    }
    set({ historyViewMode, selectedProfileId: nextSelectedId });
  },
  setFilterSimulatorInput: (filterSimulatorInput) => set({ filterSimulatorInput }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTerminalLogs: (terminalLogs) => set({ terminalLogs }),
  appendTerminalLog: (text) => set((state) => ({ terminalLogs: state.terminalLogs + text })),
  clearTerminalLogs: () => set({ terminalLogs: '' }),
  setCompiledBashCmd: (compiledBashCmd) => set({ compiledBashCmd }),
  setReportData: (reportData) => set({ reportData }),
  setInvalidPaths: (invalidPaths) => set({ invalidPaths }),

  setModalState: (updater) =>
    set((state) => ({
      modalState: typeof updater === 'function' ? updater(state.modalState) : { ...state.modalState, ...updater },
    })),

  setValidationState: (updater) =>
    set((state) => ({
      validationState: typeof updater === 'function' ? updater(state.validationState) : { ...state.validationState, ...updater },
    })),

  fetchInitialState: async () => {
    try {
      const init = await filesExporterApiService.getInitialState();
      set({
        defaultConfig: init.defaultConfig,
        config: init.currentConfig,
        historyList: init.history,
        selectedProfileId: init.selectedId,
        historyViewMode: init.historyViewMode,
        currentRepo: init.currentRepo,
        workspaceRoot: init.workspaceRoot,
        fileExtsCategoryGroups: init.fileExtsCategoryGroups,
        exchangeLinks: init.exchange,
        pendingPaths: init.pendingPaths || [],
      });
    } catch (e) {
      console.error('[useExporterStore] Error fetching initial state:', e);
    }
  },

  saveProfile: async () => {
    const { config, selectedProfileId, currentRepo } = get();
    try {
      const res = await filesExporterHistoryApiService.saveHistory(config, selectedProfileId, currentRepo);
      set({ historyList: res.history, selectedProfileId: res.selectedId });
    } catch (e) {
      console.error('[useExporterStore] Error saving profile:', e);
    }
  },

  selectProfile: async (id) => {
    const { historyList, defaultConfig } = get();
    set({ selectedProfileId: id });
    if (id === 'default') {
      set({ config: defaultConfig });
    } else {
      const found = historyList.find((h) => h.id === id);
      if (found) set({ config: found.config });
    }
  },

  freezeToggle: async (id) => {
    const { historyList } = get();
    const target = historyList.find((h) => h.id === id);
    if (!target) return;
    try {
      const updated = await filesExporterHistoryApiService.toggleFreeze(id, !target.frozen);
      set({ historyList: updated });
    } catch (e) {
      console.error('[useExporterStore] Error toggling freeze:', e);
    }
  },

  resetConfig: () => {
    const { selectedProfileId, historyList, defaultConfig } = get();
    if (selectedProfileId === 'default') {
      set({ config: defaultConfig });
    } else {
      const found = historyList.find((h) => h.id === selectedProfileId);
      if (found) set({ config: found.config });
    }
  },

  renameProfile: async (id, newName) => {
    try {
      const updated = await filesExporterHistoryApiService.updateEntryDisplay(id, newName);
      set({ historyList: updated });
    } catch (e) {
      console.error('[useExporterStore] Error renaming profile:', e);
    }
  },

  duplicateProfile: async (id) => {
    const { currentRepo } = get();
    try {
      const res = await filesExporterHistoryApiService.duplicateEntry(id, currentRepo);
      set({ historyList: res.history, selectedProfileId: res.newId });
      return res.newId;
    } catch (e) {
      console.error('[useExporterStore] Error duplicating profile:', e);
      return null;
    }
  },

  addProfile: async (customConfig?: ExportConfig) => {
    const { defaultConfig, workspaceRoot, currentRepo } = get();
    const targetConfig = customConfig || defaultConfig;
    try {
      const res = await filesExporterHistoryApiService.addNewEntry(targetConfig, workspaceRoot, currentRepo);
      set({ historyList: res.history, selectedProfileId: res.newId, config: targetConfig });
      return res.newId;
    } catch (e) {
      console.error('[useExporterStore] Error adding profile:', e);
      return null;
    }
  },

  clearHistoryWithMode: async (mode) => {
    const { selectedProfileId, historyList, defaultConfig } = get();
    if (selectedProfileId === 'default' && (mode === 'remove-selected-hard' || mode === 'remove-selected-soft')) {
      return;
    }
    try {
      const res = await filesExporterHistoryApiService.clearHistoryWithMode({ selectedId: selectedProfileId, mode });
      if (res && Array.isArray(res.history)) {
        set({ historyList: res.history, selectedProfileId: res.selectedId || 'default' });
        if (!res.selectedId || res.selectedId === 'default') {
          set({ config: defaultConfig });
        }
      } else if (mode === 'remove-selected-hard' || mode === 'remove-selected-soft') {
        const updated = historyList.filter((h) => h.id !== selectedProfileId);
        set({ historyList: updated, selectedProfileId: 'default', config: defaultConfig });
      }
    } catch (e) {
      console.error('[useExporterStore] Error clearing history:', e);
      if (mode === 'remove-selected-hard' || mode === 'remove-selected-soft') {
        const updated = historyList.filter((h) => h.id !== selectedProfileId);
        set({ historyList: updated, selectedProfileId: 'default', config: defaultConfig });
      }
    }
  },
}));

import { create } from 'zustand';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { fileExporterHistoryApiService } from '@/services/api/file-exporter-history-api.service.gen';
import { DEFAULT_EXPORT_CONFIG, DEFAULT_EXPORT_FILTER, DEFAULT_REFERENCE_FILTER } from '../constants/exporter-constants';
import {
  ExportConfig,
  ExportFilter,
  HistoryEntry,
  HistoryViewMode,
  ExportReportData,
  FileExtCategoryGroup,
  ExportExchangeLink,
} from '@/shared/services/file-exporter/model/file-exporter-model';
import { ExporterTabId, ExporterModalState, FieldValidationState } from '../types/exporter.types';

export function normalizeExportFilter(rawFilter: any, fallbackDefault: ExportFilter): ExportFilter {
  if (!rawFilter || typeof rawFilter !== 'object') {
    return { ...fallbackDefault };
  }
  return {
    src: rawFilter.src ?? '',
    max_file: String(rawFilter.max_file ?? fallbackDefault.max_file),
    inc_paths: rawFilter.inc_paths ?? fallbackDefault.inc_paths,
    exc_paths: rawFilter.exc_paths ?? fallbackDefault.exc_paths,
    inc_ext: rawFilter.inc_ext ?? fallbackDefault.inc_ext,
    exc_ext: rawFilter.exc_ext ?? fallbackDefault.exc_ext,
  };
}

export function normalizeExportConfig(rawConfig: any): ExportConfig {
  if (!rawConfig) return DEFAULT_EXPORT_CONFIG;

  const codebaseFilter: ExportFilter = rawConfig.codebase
    ? normalizeExportFilter(rawConfig.codebase, DEFAULT_EXPORT_FILTER)
    : {
        src: rawConfig.codebase_src ?? rawConfig.src ?? '',
        max_file: String(rawConfig.codebase_max_file ?? rawConfig.max_file ?? DEFAULT_EXPORT_FILTER.max_file),
        inc_paths: rawConfig.codebase_inc_paths ?? rawConfig.inc_paths ?? DEFAULT_EXPORT_FILTER.inc_paths,
        exc_paths: rawConfig.codebase_exc_paths ?? rawConfig.exc_paths ?? DEFAULT_EXPORT_FILTER.exc_paths,
        inc_ext: rawConfig.codebase_inc_ext ?? rawConfig.inc_ext ?? DEFAULT_EXPORT_FILTER.inc_ext,
        exc_ext: rawConfig.codebase_exc_ext ?? rawConfig.exc_ext ?? DEFAULT_EXPORT_FILTER.exc_ext,
      };

  const referenceFilter: ExportFilter = rawConfig.reference
    ? normalizeExportFilter(rawConfig.reference, DEFAULT_REFERENCE_FILTER)
    : {
        src: rawConfig.reference_src ?? '',
        max_file: String(rawConfig.reference_max_file ?? DEFAULT_REFERENCE_FILTER.max_file),
        inc_paths: rawConfig.reference_inc_paths ?? DEFAULT_REFERENCE_FILTER.inc_paths,
        exc_paths: rawConfig.reference_exc_paths ?? DEFAULT_REFERENCE_FILTER.exc_paths,
        inc_ext: rawConfig.reference_inc_ext ?? DEFAULT_REFERENCE_FILTER.inc_ext,
        exc_ext: rawConfig.reference_exc_ext ?? DEFAULT_REFERENCE_FILTER.exc_ext,
      };

  return {
    codebase: codebaseFilter,
    reference: referenceFilter,
    dest: rawConfig.dest ?? 'exported-files',
    format: rawConfig.format ?? 'yaml',
    max_chunk: String(rawConfig.max_chunk ?? '0'),
    groupByExt: Boolean(rawConfig.groupByExt),
    copyGeneratedFilesToClipboard: Boolean(rawConfig.copyGeneratedFilesToClipboard),
    generateTreeView: Boolean(rawConfig.generateTreeView),
    logConsole: Boolean(rawConfig.logConsole),
    logFile: Boolean(rawConfig.logFile),
    generatePromptFile: true,
  };
}

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
  activeTab: 'codebase-report',
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
    codebasePathListInvalid: false,
    referencePathListInvalid: false,
    destDirInvalid: false,
    maxFileInvalid: false,
    maxChunkInvalid: false,
    errors: {},
  },

  setPrompt: (prompt: string) => set((state) => ({ prompt, config: { ...state.config, prompt } })),
    setConfig: (updater) =>
    set((state) => ({
      config: typeof updater === 'function' ? normalizeExportConfig(updater(state.config)) : normalizeExportConfig(updater),
    })),

  setHistoryList: (historyList) => set({ historyList }),

  setSelectedProfileId: (id) => set({ selectedProfileId: id }),
  setHistoryViewMode: (historyViewMode) => set({ historyViewMode }),
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
      const init = await fileExporterApiService.getInitialState();
      const normDefault = normalizeExportConfig(init.defaultConfig);
      const normCurrent = normalizeExportConfig(init.currentConfig);
      const normHistory = (init.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));

      set({
        defaultConfig: normDefault,
        config: normCurrent,
        historyList: normHistory,
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
      const res = await fileExporterHistoryApiService.saveHistory(config, selectedProfileId, currentRepo);
      const normHistory = (res.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      set({ historyList: normHistory, selectedProfileId: res.selectedId });
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
      if (found) set({ config: normalizeExportConfig(found.config) });
    }
  },

  freezeToggle: async (id) => {
    const { historyList } = get();
    const target = historyList.find((h) => h.id === id);
    if (!target) return;
    try {
      const updated = await fileExporterHistoryApiService.toggleFreeze(id, !target.frozen);
      const normHistory = (updated || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      set({ historyList: normHistory });
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
      if (found) set({ config: normalizeExportConfig(found.config) });
    }
  },

  renameProfile: async (id, newName) => {
    try {
      const updated = await fileExporterHistoryApiService.updateEntryDisplay(id, newName);
      const normHistory = (updated || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      set({ historyList: normHistory });
    } catch (e) {
      console.error('[useExporterStore] Error renaming profile:', e);
    }
  },

  duplicateProfile: async (id) => {
    const { currentRepo } = get();
    try {
      const res = await fileExporterHistoryApiService.duplicateEntry(id, currentRepo);
      const normHistory = (res.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      set({ historyList: normHistory, selectedProfileId: res.newId });
      return res.newId;
    } catch (e) {
      console.error('[useExporterStore] Error duplicating profile:', e);
      return null;
    }
  },

  addProfile: async (customConfig?: ExportConfig) => {
    const { defaultConfig, workspaceRoot, currentRepo } = get();
    const targetConfig = normalizeExportConfig(customConfig || defaultConfig);
    try {
      const res = await fileExporterHistoryApiService.addNewEntry(targetConfig, workspaceRoot, currentRepo);
      const normHistory = (res.history || []).map((h) => ({
        ...h,
        config: normalizeExportConfig(h.config),
      }));
      set({ historyList: normHistory, selectedProfileId: res.newId, config: targetConfig });
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
      const res = await fileExporterHistoryApiService.clearHistoryWithMode({ selectedId: selectedProfileId, mode });
      if (res && Array.isArray(res.history)) {
        const normHistory = res.history.map((h) => ({
          ...h,
          config: normalizeExportConfig(h.config),
        }));
        set({ historyList: normHistory, selectedProfileId: res.selectedId || 'default' });
        if (!res.selectedId || res.selectedId === 'default') {
          set({ config: defaultConfig });
        }
      } else if (mode === 'remove-selected-hard' || mode === 'remove-selected-soft') {
        const updated = historyList.filter((h) => h.id !== selectedProfileId);
        set({ historyList: updated, selectedProfileId: 'default', config: defaultConfig });
      }
    } catch (e) {
      console.error('[useExporterStore] Error clearing history:', e);
    }
  },
}));

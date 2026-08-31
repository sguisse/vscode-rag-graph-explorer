import { create } from 'zustand';
import { DEFAULT_EXPORT_CONFIG } from '../constants/exporter-constants';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { ExportConfig, HistoryEntry, ExportReportData } from '@/shared/services/files-exporter/model/files-exporter-model';

const STORAGE_KEY = 'tokenRazor.exporter.historyProfiles';

export interface ExporterStoreState {
  config: ExportConfig;
  historyList: HistoryEntry[];
  selectedProfileId: string;
  filterSimulatorInput: string;
  isRunning: boolean;
  activeTab: string;
  terminalLogs: string;
  compiledBashCmd: string;
  reportData: ExportReportData | null;

  setConfig: (updater: ExportConfig | ((prev: ExportConfig) => ExportConfig)) => void;
  setHistoryList: (list: HistoryEntry[]) => void;
  setSelectedProfileId: (id: string) => void;
  setFilterSimulatorInput: (val: string) => void;
  setIsRunning: (running: boolean) => void;
  setActiveTab: (tab: string) => void;
  setTerminalLogs: (logs: string) => void;
  appendTerminalLog: (text: string) => void;
  clearTerminalLogs: () => void;
  setCompiledBashCmd: (cmd: string) => void;
  setReportData: (data: ExportReportData | null) => void;

  loadProfiles: () => Promise<void>;
  saveProfiles: (profiles: HistoryEntry[]) => void;
  handleFreezeToggle: (id: string) => void;
  handleResetConfig: () => void;
  handleRenameProfile: (id: string, newName: string) => void;
  handleDuplicateProfile: (id: string) => void;
  handleAddProfile: () => void;
  handleClearHistory: () => void;
}

export const useExporterStore = create<ExporterStoreState>((set, get) => ({
  config: DEFAULT_EXPORT_CONFIG,
  historyList: [],
  selectedProfileId: 'default',
  filterSimulatorInput: '',
  isRunning: false,
  activeTab: 'report',
  terminalLogs: '',
  compiledBashCmd: '',
  reportData: null,

  setConfig: (updater) =>
    set((state) => ({
      config: typeof updater === 'function' ? updater(state.config) : updater,
    })),

  setHistoryList: (historyList) => set({ historyList }),

  setSelectedProfileId: (id) => {
    const { historyList } = get();
    set({ selectedProfileId: id });
    if (id === 'default') {
      set({ config: DEFAULT_EXPORT_CONFIG });
    } else {
      const found = historyList.find((h) => h.id === id);
      if (found) set({ config: found.config });
    }
  },

  setFilterSimulatorInput: (filterSimulatorInput) => set({ filterSimulatorInput }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setTerminalLogs: (terminalLogs) => set({ terminalLogs }),
  appendTerminalLog: (text) => set((state) => ({ terminalLogs: state.terminalLogs + text })),
  clearTerminalLogs: () => set({ terminalLogs: '' }),
  setCompiledBashCmd: (compiledBashCmd) => set({ compiledBashCmd }),
  setReportData: (reportData) => set({ reportData }),

  loadProfiles: async () => {
    try {
      const data = await vsCodeApiService.readUserPreferences(STORAGE_KEY);
      if (Array.isArray(data?.profiles)) {
        set({ historyList: data.profiles });
      }
    } catch {
      // Preferences fallback
    }
  },

  saveProfiles: (profiles) => {
    set({ historyList: profiles });
    vsCodeApiService.saveUserPreferences(STORAGE_KEY, { profiles }).catch(() => {});
  },

  handleFreezeToggle: (id) => {
    const { historyList, saveProfiles } = get();
    const updated = historyList.map((h) => (h.id === id ? { ...h, frozen: !h.frozen } : h));
    saveProfiles(updated);
  },

  handleResetConfig: () => {
    const { selectedProfileId, historyList } = get();
    if (selectedProfileId === 'default') {
      set({ config: DEFAULT_EXPORT_CONFIG });
    } else {
      const found = historyList.find((h) => h.id === selectedProfileId);
      if (found) set({ config: found.config });
    }
  },

  handleRenameProfile: (id, newName) => {
    const { historyList, saveProfiles } = get();
    const updated = historyList.map((h) => (h.id === id ? { ...h, display: newName } : h));
    saveProfiles(updated);
  },

  handleDuplicateProfile: (id) => {
    const { historyList, config, saveProfiles } = get();
    const targetConfig = id === 'default' ? config : historyList.find((h) => h.id === id)?.config || config;
    const newEntry: HistoryEntry = {
      id: `profile-${Date.now()}`,
      repo: 'workspace',
      display: `Profile Copy (${new Date().toLocaleTimeString()})`,
      frozen: false,
      config: { ...targetConfig },
    };
    const updated = [newEntry, ...historyList];
    saveProfiles(updated);
    set({ selectedProfileId: newEntry.id });
  },

  handleAddProfile: () => {
    const { historyList, saveProfiles } = get();
    const newEntry: HistoryEntry = {
      id: `profile-${Date.now()}`,
      repo: 'workspace',
      display: `New Profile (${new Date().toLocaleTimeString()})`,
      frozen: false,
      config: { ...DEFAULT_EXPORT_CONFIG },
    };
    const updated = [newEntry, ...historyList];
    saveProfiles(updated);
    set({ selectedProfileId: newEntry.id, config: DEFAULT_EXPORT_CONFIG });
  },

  handleClearHistory: () => {
    const { saveProfiles } = get();
    saveProfiles([]);
    set({ selectedProfileId: 'default', config: DEFAULT_EXPORT_CONFIG });
  },
}));

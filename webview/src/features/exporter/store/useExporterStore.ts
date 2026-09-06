import { create } from 'zustand';
import { DEFAULT_EXPORT_CONFIG } from '../constants/exporter-constants';
import { normalizeExportConfig } from '../utils/exporter-config.normalizer';
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
  prompt?: string;
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

  // Atomic setters
  setPrompt: (prompt: string) => void;
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
  setInitialData: (data: Partial<ExporterStoreState>) => void;
}

export const useExporterStore = create<ExporterStoreState>((set) => ({
  defaultConfig: DEFAULT_EXPORT_CONFIG,
  config: DEFAULT_EXPORT_CONFIG,
  prompt: '',
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

  setPrompt: (prompt: string) =>
    set((state) => ({
      prompt,
      config: { ...state.config, prompt },
    })),

  setConfig: (updater) =>
    set((state) => ({
      config: typeof updater === 'function' ? normalizeExportConfig(updater(state.config)) : normalizeExportConfig(updater),
    })),

  setHistoryList: (historyList) => set({ historyList }),
  setSelectedProfileId: (selectedProfileId) => set({ selectedProfileId }),
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

  setInitialData: (data) => set((state) => ({ ...state, ...data })),
}));

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
  FilesExporterResult,
} from '@/shared/services/file-exporter/model/file-exporter-model';
import { ExporterTabId, ExporterModalState, FieldValidationState } from '../types/exporter.types';

export type LlmResponseSubTab = 'apply' | 'inspect';

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

  // Execution tracking
  lastPid: number;
  lastTimestamp: string;
  lastExportResult: FilesExporterResult | null;

  modalState: ExporterModalState;
  validationState: FieldValidationState;

  // LLM Response State Slice
  llmSubTab: LlmResponseSubTab;
  llmResponseText: string;
  llmShScript: string;
  llmExecutionLog: string;
  llmImpactedFilesCount: number;
  llmGitCommitMessage: string;
  llmIsExecuting: boolean;

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
  setLastPid: (pid: number) => void;
  setLastTimestamp: (ts: string) => void;
  setLastExportResult: (res: FilesExporterResult | null) => void;
  setModalState: (updater: Partial<ExporterModalState> | ((prev: ExporterModalState) => ExporterModalState)) => void;
  setValidationState: (updater: Partial<FieldValidationState> | ((prev: FieldValidationState) => FieldValidationState)) => void;

  setLlmSubTab: (subTab: LlmResponseSubTab) => void;
  setLlmResponseText: (text: string) => void;
  setLlmShScript: (script: string) => void;
  setLlmExecutionLog: (log: string) => void;
  setLlmImpactedFilesCount: (count: number) => void;
  setLlmGitCommitMessage: (msg: string) => void;
  setLlmIsExecuting: (executing: boolean) => void;

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
  activeTab: 'prompt',
  terminalLogs: '',
  compiledBashCmd: '',
  reportData: null,
  invalidPaths: [],
  pendingPaths: [],
  lastPid: 0,
  lastTimestamp: '',
  lastExportResult: null,

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

  // LLM Response State Slice
  llmSubTab: 'apply',
  llmResponseText: '',
  llmShScript: '',
  llmExecutionLog: '',
  llmImpactedFilesCount: 0,
  llmGitCommitMessage: '',
  llmIsExecuting: false,

  // Actions
  setPrompt: (prompt: string) =>
    set((state) => ({
      prompt,
      config: normalizeExportConfig({ ...state.config, prompt }),
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
  setLastPid: (lastPid) => set({ lastPid }),
  setLastTimestamp: (lastTimestamp) => set({ lastTimestamp }),
  setLastExportResult: (lastExportResult) => set({ lastExportResult }),
  setModalState: (updater) => set((state) => ({ modalState: typeof updater === 'function' ? updater(state.modalState) : { ...state.modalState, ...updater } })),
  setValidationState: (updater) => set((state) => ({ validationState: typeof updater === 'function' ? updater(state.validationState) : { ...state.validationState, ...updater } })),

  setLlmSubTab: (llmSubTab) => set({ llmSubTab }),
  setLlmResponseText: (llmResponseText) => set({ llmResponseText }),
  setLlmShScript: (llmShScript) => set({ llmShScript }),
  setLlmExecutionLog: (llmExecutionLog) => set({ llmExecutionLog }),
  setLlmImpactedFilesCount: (llmImpactedFilesCount) => set({ llmImpactedFilesCount }),
  setLlmGitCommitMessage: (llmGitCommitMessage) => set({ llmGitCommitMessage }),
  setLlmIsExecuting: (llmIsExecuting) => set({ llmIsExecuting }),

  setInitialData: (data) => set((state) => ({ ...state, ...data })),
}));

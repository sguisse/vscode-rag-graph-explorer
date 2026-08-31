import { create } from 'zustand';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/types/type-graph-rendering';
import { ExportFormat } from '@/shared/services/codebase-exporter/types';
import { demoCodebase } from '../components/dependency-graph/data/GraphData';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';

export interface AnonymizationRule {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  inversePattern: string;
  enabled: boolean;
}

export const DEFAULT_ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    id: 'rule-secrets',
    name: 'Secret & Password Tokens',
    pattern: '(?i)(password|secret|key|token)\\s*[:=]\\s*[\'"][^\'"]+[\'"]',
    replacement: '$1: "ANONYMIZED_SECRET"',
    inversePattern: 'ANONYMIZED_SECRET',
    enabled: true,
  },
  {
    id: 'rule-db-uri',
    name: 'Database JDBC/Connection URIs',
    pattern: 'jdbc:[a-z0-9]+://[^:\\s]+:[0-9]+/[a-zA-Z0-9_]+',
    replacement: 'jdbc:provider://anonymized-host:5432/anon_db',
    inversePattern: 'jdbc:provider://anonymized-host:5432/anon_db',
    enabled: true,
  },
  {
    id: 'rule-ip',
    name: 'IPv4 Addresses',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    replacement: '127.0.0.1',
    inversePattern: '127.0.0.1',
    enabled: true,
  },
  {
    id: 'rule-db-user',
    name: 'Database Usernames',
    pattern: 'db_admin_prod',
    replacement: 'db_user_anon',
    inversePattern: 'db_user_anon',
    enabled: true,
  },
];

export interface ImpactedPathsPanelState {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  pathsList: string[];
  setPathsList: (paths: string[] | ((prev: string[]) => string[])) => void;
  paths: string;
  setPaths: (paths: string | ((prev: string) => string)) => void;
  upstreamDepth: number;
  setUpstreamDepth: (depth: number) => void;
  downstreamDepth: number;
  setDownstreamDepth: (depth: number) => void;
  codebase: CodebaseData;
  setCodebase: (data: CodebaseData) => void;
}

export interface CodebaseTreePanelState {
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: (folders: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  toggleFolder: (folderKey: string) => void;
  visibleFiles: Record<string, boolean>;
  setVisibleFiles: (files: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  toggleFileCheckbox: (id: string) => void;
  toggleFolderCheckbox: (folderKey: string) => void;
}

export interface DependencyGraphPanelState {
  graphRendering: GraphRendering;
  setGraphRendering: (mode: GraphRendering) => void;
  currentLayout: string;
  setCurrentLayout: (layout: string) => void;
  maxNodesLimit: number;
  setMaxNodesLimit: (limit: number) => void;
  callersDepth: number;
  setCallersDepth: (depth: number) => void;
  calleesDepth: number;
  setCalleesDepth: (depth: number) => void;
  displayLevel: string;
  setDisplayLevel: (level: string) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  attributesVisible: boolean;
  setAttributesVisible: (val: boolean) => void;
  methodsVisible: boolean;
  setMethodsVisible: (val: boolean) => void;
  showSelectedOnly: boolean;
  setShowSelectedOnly: (val: boolean) => void;
  autoFit: boolean;
  setAutoFit: (autoFit: boolean | ((prev: boolean) => boolean)) => void;
  toggleAutoFit: () => void;
  showMinimap: boolean;
  setShowMinimap: (showMinimap: boolean) => void;
  toggleShowMinimap: () => void;
  cyRef: React.RefObject<any> | null;
  setCyRef: (ref: React.RefObject<any> | null) => void;
}

export interface FocusState {
  focusedNodeId: string | null;
  setFocusedNodeId: (id: string | null) => void;
}

export interface FilesContextPanelState {
  rightPanelTab: 'inspect' | 'files_context' | 'transformer';
  setRightPanelTab: (tab: 'inspect' | 'files_context' | 'transformer') => void;
  selectedEntity: any | null;
  setSelectedEntity: (entity: any | null) => void;
  enableDownstream: boolean;
  setEnableDownstream: (val: boolean | ((prev: boolean) => boolean)) => void;
  enableUpstream: boolean;
  setEnableUpstream: (val: boolean | ((prev: boolean) => boolean)) => void;
  targetFilePaths: string[];
  setTargetFilePaths: (paths: string[]) => void;
  selectedContextFiles: Record<string, boolean>;
  setSelectedContextFiles: (files: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  selectAllFiles: () => void;
  toggleContextFileCheckbox: (id: string) => void;
  expandedContextGroups: Record<string, boolean>;
  setExpandedContextGroups: (groups: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}

export interface FilesCtxExportState {
  exportFormat: ExportFormat;
  maxChunk: string;
  splitChunkByFileExtension: boolean;
  copyAsFilesToClipboard: boolean;
  setExportFormat: (format: ExportFormat) => void;
  setMaxChunk: (chunk: string) => void;
  setSplitChunkByFileExtension: (val: boolean) => void;
  setCopyAsFilesToClipboard: (val: boolean) => void;
}

export interface ContextTransformerState {
  transformerRules: AnonymizationRule[];
  setTransformerRules: (rules: AnonymizationRule[] | ((prev: AnonymizationRule[]) => AnonymizationRule[])) => void;
}

export interface CodebaseDomainState
  extends ImpactedPathsPanelState,
    CodebaseTreePanelState,
    DependencyGraphPanelState,
    FocusState,
    FilesContextPanelState,
    FilesCtxExportState,
    ContextTransformerState {}

let focusedNodeTimer: ReturnType<typeof setTimeout> | null = null;

export const useCodebaseDomainState = create<CodebaseDomainState>((set) => ({
  // --- Impacted Paths Slice ---
  currentPath: '',
  setCurrentPath: (path) =>
    set((s) => {
      const allSelected: Record<string, boolean> = {};
      (s.codebase?.files || []).forEach((f: any) => {
        allSelected[f.id] = true;
      });
      return { currentPath: path, visibleFiles: allSelected, selectedContextFiles: allSelected };
    }),

  pathsList: [],
  setPathsList: (paths) => set((s) => ({ pathsList: typeof paths === 'function' ? paths(s.pathsList) : paths })),

  paths: '',
  setPaths: (paths) =>
    set((s) => {
      const newPaths = typeof paths === 'function' ? paths(s.paths) : paths;
      const allSelected: Record<string, boolean> = {};
      (s.codebase?.files || []).forEach((f: any) => {
        allSelected[f.id] = true;
      });
      return { paths: newPaths, visibleFiles: allSelected, selectedContextFiles: allSelected };
    }),

  upstreamDepth: 2,
  setUpstreamDepth: (depth) => set({ upstreamDepth: depth }),

  downstreamDepth: 2,
  setDownstreamDepth: (depth) => set({ downstreamDepth: depth }),

  codebase: demoCodebase as any,
  setCodebase: (data) => {
    const allSelected: Record<string, boolean> = {};
    (data?.files || []).forEach((f: any) => {
      allSelected[f.id] = true;
    });
    set({ codebase: data, visibleFiles: allSelected, selectedContextFiles: allSelected });
  },

  // --- Codebase Tree Slice (Controls Graph Node Visibility) ---
  expandedFolders: {},
  setExpandedFolders: (folders) =>
    set((s) => ({ expandedFolders: typeof folders === 'function' ? folders(s.expandedFolders) : folders })),

  toggleFolder: (folderKey) =>
    set((s) => ({
      expandedFolders: {
        ...s.expandedFolders,
        [folderKey]: s.expandedFolders[folderKey] === undefined ? false : !s.expandedFolders[folderKey],
      },
    })),

  visibleFiles: {
    'OrderButton.tsx': true,
    'orderApi.ts': true,
    'OrderController.java': true,
    'Order.java': true,
    'OrderRepository.java': true,
    'JpaOrderRepository.java': true,
    'application.yml': true,
  },
  setVisibleFiles: (files) =>
    set((s) => ({ visibleFiles: typeof files === 'function' ? files(s.visibleFiles) : files })),

  toggleFileCheckbox: (id) =>
    set((s) => ({
      visibleFiles: {
        ...s.visibleFiles,
        [id]: !s.visibleFiles[id],
      },
    })),

  toggleFolderCheckbox: (folderKey) =>
    set((s) => {
      const codebaseFiles = s.codebase?.files || [];
      const folderFiles = codebaseFiles.filter((f) => f.path.startsWith(folderKey));
      const allChecked = folderFiles.every((f) => s.visibleFiles[f.id]);
      const updated = { ...s.visibleFiles };
      folderFiles.forEach((f) => {
        updated[f.id] = !allChecked;
      });
      return { visibleFiles: updated };
    }),

  // --- Dependency Graph Slice ---
  graphRendering: 'rounded',
  setGraphRendering: (mode) => set({ graphRendering: mode }),
  currentLayout: 'cose',
  setCurrentLayout: (layout) => set({ currentLayout: layout }),
  maxNodesLimit: 50,
  setMaxNodesLimit: (limit) => set({ maxNodesLimit: limit }),
  callersDepth: 2,
  setCallersDepth: (depth) => set({ callersDepth: depth }),
  calleesDepth: 2,
  setCalleesDepth: (depth) => set({ calleesDepth: depth }),
  displayLevel: 'all',
  setDisplayLevel: (level) => set({ displayLevel: level }),

  showGrid: true,
  setShowGrid: (showGrid) => set({ showGrid }),
  attributesVisible: false,
  setAttributesVisible: (attributesVisible) => set({ attributesVisible }),
  methodsVisible: true,
  setMethodsVisible: (methodsVisible) => set({ methodsVisible }),
  showSelectedOnly: false,
  setShowSelectedOnly: (showSelectedOnly) => set({ showSelectedOnly }),

  autoFit: true,
  setAutoFit: (autoFit) => set((s) => ({ autoFit: typeof autoFit === 'function' ? autoFit(s.autoFit) : autoFit })),
  toggleAutoFit: () => set((s) => ({ autoFit: !s.autoFit })),

  showMinimap: false,
  setShowMinimap: (showMinimap) => set({ showMinimap }),
  toggleShowMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),

  cyRef: null,
  setCyRef: (cyRef) => set({ cyRef }),

  // --- Focus Node Slice ---
  focusedNodeId: null,
  setFocusedNodeId: (id) => {
    if (focusedNodeTimer) {
      clearTimeout(focusedNodeTimer);
      focusedNodeTimer = null;
    }
    set({ focusedNodeId: id });
    if (id) {
      focusedNodeTimer = setTimeout(() => {
        set({ focusedNodeId: null });
        focusedNodeTimer = null;
      }, 2000);
    }
  },

  // --- Files Context & Inspector Slice (Controls Context Export & Impact Plan) ---
  rightPanelTab: 'files_context',
  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),

  selectedEntity: null,
  setSelectedEntity: (entity) =>
    set((s) => ({
      selectedEntity: entity,
      rightPanelTab: entity ? 'inspect' : s.rightPanelTab,
    })),

  enableDownstream: true,
  setEnableDownstream: (val) =>
    set((s) => ({ enableDownstream: typeof val === 'function' ? val(s.enableDownstream) : val })),
  enableUpstream: false,
  setEnableUpstream: (val) =>
    set((s) => ({ enableUpstream: typeof val === 'function' ? val(s.enableUpstream) : val })),

  targetFilePaths: [],
  setTargetFilePaths: (paths) => set({ targetFilePaths: paths }),

  selectedContextFiles: {
    'OrderButton.tsx': true,
    'orderApi.ts': true,
    'OrderController.java': true,
    'Order.java': true,
    'OrderRepository.java': true,
    'JpaOrderRepository.java': true,
    'application.yml': true,
  },
  setSelectedContextFiles: (files) =>
    set((s) => ({ selectedContextFiles: typeof files === 'function' ? files(s.selectedContextFiles) : files })),

  selectAllFiles: () =>
    set((s) => {
      const allSelected: Record<string, boolean> = {};
      (s.codebase?.files || []).forEach((f: any) => {
        allSelected[f.id] = true;
      });
      return { visibleFiles: allSelected, selectedContextFiles: allSelected };
    }),

  toggleContextFileCheckbox: (id) =>
    set((s) => ({
      selectedContextFiles: {
        ...s.selectedContextFiles,
        [id]: !s.selectedContextFiles[id],
      },
    })),

  expandedContextGroups: {},
  setExpandedContextGroups: (groups) =>
    set((s) => ({ expandedContextGroups: typeof groups === 'function' ? groups(s.expandedContextGroups) : groups })),

  // --- Files Export Slice ---
  exportFormat: 'yaml',
  maxChunk: '0',
  splitChunkByFileExtension: false,
  copyAsFilesToClipboard: true,
  setExportFormat: (exportFormat) => set({ exportFormat }),
  setMaxChunk: (maxChunk) => set({ maxChunk }),
  setSplitChunkByFileExtension: (splitChunkByFileExtension) => set({ splitChunkByFileExtension }),
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard) => set({ copyAsFilesToClipboard }),

  // --- Context Transformer Slice ---
  transformerRules: DEFAULT_ANONYMIZATION_RULES,
  setTransformerRules: (transformerRules) =>
    set((s) => ({
      transformerRules:
        typeof transformerRules === 'function'
          ? transformerRules(s.transformerRules)
          : transformerRules,
    })),
}));

export const useExplorerStore = useCodebaseDomainState;

// Persistent User Preferences Synchronization
const SETTINGS_PREF_KEY = 'tokenRazor.graphRagExplorer.userPreferences';
const PERSISTED_KEYS: (keyof CodebaseDomainState)[] = [
  'upstreamDepth',
  'downstreamDepth',
  'callersDepth',
  'calleesDepth',
  'graphRendering',
  'currentLayout',
  'showGrid',
  'attributesVisible',
  'methodsVisible',
  'showSelectedOnly',
  'autoFit',
  'showMinimap',
  'enableDownstream',
  'enableUpstream',
  'rightPanelTab',
  'exportFormat',
  'maxChunk',
  'splitChunkByFileExtension',
  'copyAsFilesToClipboard',
  'transformerRules',
];

let isHydrating = false;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPersistedHash = '';

const hydrateStore = async () => {
  try {
    isHydrating = true;
    const userPrefs: any = await vsCodeApiService.readUserPreferences(SETTINGS_PREF_KEY);
    if (userPrefs && typeof userPrefs === 'object' && Object.keys(userPrefs).length > 0) {
      useCodebaseDomainState.setState(userPrefs);
      logInfo('CodebaseDomainState store hydrated from user preferences.');
    }
  } catch (error: any) {
    logError('Failed to hydrate CodebaseDomainState store:', error);
  } finally {
    isHydrating = false;
  }
};

hydrateStore();

useCodebaseDomainState.subscribe((state) => {
  if (isHydrating) return;
  if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

  saveDebounceTimer = setTimeout(() => {
    queueMicrotask(() => {
      const payload: Record<string, any> = {};
      for (const key of PERSISTED_KEYS) {
        const val = state[key];
        if (val !== undefined && typeof val !== 'function') {
          payload[key] = val;
        }
      }
      const currentHash = JSON.stringify(payload);
      if (currentHash === lastPersistedHash) return;
      lastPersistedHash = currentHash;

      vsCodeApiService
        .saveUserPreferences(SETTINGS_PREF_KEY, payload)
        .then(() => logInfo('Asynchronously saved CodebaseDomainState user preferences.'))
        .catch((err) => logError('Failed to save CodebaseDomainState user preferences:', err));
    });
  }, 600);
});

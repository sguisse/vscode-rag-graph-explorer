import { create } from 'zustand';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';
import {
  LlmProvider,
  IChatMessageDto,
  IFileContextDto,
} from '@/shared/services/llm-chat';
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';
import { WorkflowData } from '@/components/app/workflow/model/workflow-model';
import defaultWorkflowData from '../workflow/data-workflow.json';
import { demoCodebase, FOLDER_POSITIONS } from '../wksp-cnt-graph/data/GraphData';
import { INITIAL_VISIBLE_FILES_CONFIG, FOLDER_KEYS_REGISTERED_CONFIG } from '../constants/graph.constants';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { VsCodeSettingsKeys } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { logError, logInfo } from '@/services/view/log-view.service.wrapper';

// ============================================================================
// Data Types & Schemas
// ============================================================================

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

export interface GraphRagExplorerConfig {
  backendConfigPath: string;
  defaultClient: string;
  defaultModel: string;
  maxTokens: number;
  temperature: number;
  systemPromptPrefix: string;
  autoApplyChanges: boolean;
  saveHistoryLocally: boolean;
}

export interface PromptFields {
  predefined: string;
  mode: 'role' | 'agent';
  roleOrAgent: string;
  selectedAgent: string;
  tone: string;
  context: string;
  expected: string;
  output: string;
  samples: string;
}

const INITIAL_PROMPT_FIELDS: PromptFields = {
  predefined: 'custom',
  mode: 'role',
  roleOrAgent: 'Senior React & TypeScript Architect',
  selectedAgent: 'CodeRefactoringAgent',
  tone: 'Concise, surgical, highly technical',
  context: 'Optimizing codebase dependencies and AST context for LLM prompt engineering.',
  expected: 'Clean, production-ready React component with Tailwind CSS styling.',
  output: 'Single self-contained file with full implementation.',
  samples: 'Include full imports and type declarations without truncation.',
};

const INITIAL_CONFIG: GraphRagExplorerConfig = {
  backendConfigPath: '.token-razor/config/explorer-config.json',
  defaultClient: 'Ollama',
  defaultModel: 'llama3:latest',
  maxTokens: 4096,
  temperature: 0.2,
  systemPromptPrefix: 'You are an expert senior software architect.',
  autoApplyChanges: false,
  saveHistoryLocally: true,
};

// ============================================================================
// Dedicated Container & Panel Interfaces
// ============================================================================

export interface WorkflowState {
  dataWorkflow: WorkflowData;
  setDataWorkflow: (data: WorkflowData) => void;
  setSelectedWorkflowStep: (stepId: string) => void;
}

export interface WkpTopImpactedPathsState {
  paths: string;
  currentPath: string;
  pathsList: string[];
  upstreamDepth: number;
  downstreamDepth: number;

  setPaths: (paths: string | ((prev: string) => string)) => void;
  setCurrentPath: (path: string) => void;
  setPathsList: (list: string[] | ((prev: string[]) => string[])) => void;
  setUpstreamDepth: (depth: number) => void;
  setDownstreamDepth: (depth: number) => void;
}

export interface WkpLftCodebaseTreeState {
  searchTerm: string;
  displayLevel: string;
  maxNodesLimit: number;
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;

  setSearchTerm: (term: string) => void;
  setDisplayLevel: (level: string) => void;
  setMaxNodesLimit: (limit: number) => void;
  setExpandedFolders: (
    folders: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  toggleFolder: (folderName: string) => void;
  setVisibleFiles: (
    files: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  toggleFileCheckbox: (fileId: string) => void;
  toggleFolderCheckbox: (folderName: string, allFiles: CodebaseFile[]) => void;
  resetFilters: (allFiles: CodebaseFile[]) => void;
}

export interface WkspCntGraphState {
  codebase: CodebaseData;
  folderPositions: Record<string, { label: string }>;
  selectedEntity: SelectedEntity | null;
  focusedNodeId: string | null;

  enableDownstream: boolean;
  enableUpstream: boolean;
  callersDepth: number;
  calleesDepth: number;

  showGrid: boolean;
  currentLayout: string;
  attributesVisible: boolean;
  methodsVisible: boolean;
  showSelectedOnly: boolean;

  setCodebase: (codebase: CodebaseData | ((prev: CodebaseData) => CodebaseData)) => void;
  setFolderPositions: (positions: Record<string, { label: string }>) => void;
  setSelectedEntity: (entity: SelectedEntity | null) => void;
  setFocusedNodeId: (nodeId: string | null | ((prev: string | null) => string | null)) => void;
  setEnableDownstream: (val: boolean | ((prev: boolean) => boolean)) => void;
  setEnableUpstream: (val: boolean | ((prev: boolean) => boolean)) => void;
  setCallersDepth: (depth: number) => void;
  setCalleesDepth: (depth: number) => void;
  setShowGrid: (show: boolean | ((prev: boolean) => boolean)) => void;
  setCurrentLayout: (layout: string) => void;
  setAttributesVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  setMethodsVisible: (visible: boolean | ((prev: boolean) => boolean)) => void;
  setShowSelectedOnly: (show: boolean | ((prev: boolean) => boolean)) => void;
}

export interface WkpRgtTabsFilesContextState {
  rightPanelTab: 'inspect' | 'files_context' | 'transformer';
  selectedContextFiles: Record<string, boolean>;
  expandedContextGroups: Record<string, boolean>;

  setRightPanelTab: (tab: 'inspect' | 'files_context' | 'transformer') => void;
  setSelectedContextFiles: (
    files: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  toggleContextFileCheckbox: (fileId: string) => void;
  setExpandedContextGroups: (
    groups: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
}

export interface ContextTransformerState {
  transformerRules: AnonymizationRule[];
  setTransformerRules: (
    rules: AnonymizationRule[] | ((prev: AnonymizationRule[]) => AnonymizationRule[])
  ) => void;
}

export interface FilesCtxExportState {
  exportFormat: ExportFormat;
  maxChunk: string;
  splitChunkByFileExtension: boolean;
  copyAsFilesToClipboard: boolean;
  targetFilePaths: string[];

  setExportFormat: (exportFormat: ExportFormat) => void;
  setMaxChunk: (maxChunk: string) => void;
  setSplitChunkByFileExtension: (splitChunkByFileExtension: boolean) => void;
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard: boolean) => void;
  setTargetFilePaths: (targetFilePaths: string[]) => void;
}

export interface SdbRgtPromptTabState {
  promptTab: 'prompt' | 'llm' | 'config';
  setPromptTab: (tab: 'prompt' | 'llm' | 'config') => void;
}

export interface SdbRgtPromptBuilderState {
  config: GraphRagExplorerConfig;
  promptFields: PromptFields;
  updateConfig: (partial: Partial<GraphRagExplorerConfig>) => void;
  updatePromptFields: (partial: Partial<PromptFields>) => void;
  resetPromptFields: () => void;
  getFullPrompt: () => string;
}

export interface SdbRgtLlmChatState {
  llmProvider: LlmProvider;
  llmSelectedModel: string;
  llmMessages: IChatMessageDto[];
  llmInputPrompt: string;
  llmTemperature: number;
  llmAttachedFiles: IFileContextDto[];
  llmFilePathInput: string;
  llmExpandedCards: Record<string, boolean>;

  setLlmProvider: (provider: LlmProvider) => void;
  setLlmSelectedModel: (model: string) => void;
  setLmMessages: (
    messages: IChatMessageDto[] | ((prev: IChatMessageDto[]) => IChatMessageDto[])
  ) => void;
  setLlmInputPrompt: (prompt: string) => void;
  setLlmTemperature: (temp: number) => void;
  setLlmAttachedFiles: (
    files: IFileContextDto[] | ((prev: IFileContextDto[]) => IFileContextDto[])
  ) => void;
  setLlmFilePathInput: (input: string) => void;
  setLlmExpandedCard: (cardId: string, expanded: boolean) => void;
  toggleLlmExpandedCard: (cardId: string) => void;
  setLlmExpandedCards: (
    cards: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
}

export interface ExplorerState
  extends WorkflowState,
    WkpTopImpactedPathsState,
    WkpLftCodebaseTreeState,
    WkspCntGraphState,
    WkpRgtTabsFilesContextState,
    ContextTransformerState,
    FilesCtxExportState,
    SdbRgtPromptTabState,
    SdbRgtPromptBuilderState,
    SdbRgtLlmChatState {}

// ============================================================================
// Store Implementation
// ============================================================================

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  // Workflow State & Actions
  dataWorkflow: defaultWorkflowData as WorkflowData,
  setDataWorkflow: (dataWorkflow) => set({ dataWorkflow }),
  setSelectedWorkflowStep: (stepId) =>
    set((state) => {
      const updatedNodes = state.dataWorkflow.workflow.nodes.map((node) => {
        if (node.id === stepId) {
          return { ...node, status: 'current' as const };
        }
        if (node.status === 'current') {
          return { ...node, status: 'completed' as const };
        }
        return node;
      });

      return {
        dataWorkflow: {
          ...state.dataWorkflow,
          workflow: {
            ...state.dataWorkflow.workflow,
            initialStepId: stepId,
            nodes: updatedNodes,
          },
        },
      };
    }),

  // workspace.top (ImpactedPathsPanel)
  paths: '',
  currentPath: '',
  pathsList: [''],
  upstreamDepth: 2,
  downstreamDepth: 2,

  setPaths: (paths) =>
    set((state) => ({
      paths: typeof paths === 'function' ? paths(state.paths) : paths,
    })),
  setCurrentPath: (currentPath) => set({ currentPath }),
  setPathsList: (list) =>
    set((state) => ({
      pathsList: typeof list === 'function' ? list(state.pathsList) : list,
    })),
  setUpstreamDepth: (upstreamDepth) => set({ upstreamDepth }),
  setDownstreamDepth: (downstreamDepth) => set({ downstreamDepth }),

  // workspace.left (CodebaseExplorerPanel)
  searchTerm: '',
  displayLevel: 'all',
  maxNodesLimit: 50,
  expandedFolders: {
    frontend: true,
    backend: true,
    config: true,
    other: true,
  },
  visibleFiles: INITIAL_VISIBLE_FILES_CONFIG,

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setDisplayLevel: (displayLevel) => set({ displayLevel }),
  setMaxNodesLimit: (maxNodesLimit) => set({ maxNodesLimit }),
  setExpandedFolders: (folders) =>
    set((state) => ({
      expandedFolders: typeof folders === 'function' ? folders(state.expandedFolders) : folders,
    })),
  toggleFolder: (folderName) =>
    set((state) => ({
      expandedFolders: {
        ...state.expandedFolders,
        [folderName]: !state.expandedFolders[folderName],
      },
    })),
  setVisibleFiles: (files) =>
    set((state) => ({
      visibleFiles: typeof files === 'function' ? files(state.visibleFiles) : files,
    })),
  toggleFileCheckbox: (fileId) =>
    set((state) => ({
      visibleFiles: {
        ...state.visibleFiles,
        [fileId]: !state.visibleFiles[fileId],
      },
    })),
  toggleFolderCheckbox: (folderName, allFiles) =>
    set((state) => {
      const registeredFolders = [...FOLDER_KEYS_REGISTERED_CONFIG];
      const folderFiles = allFiles.filter((f) => {
        if (registeredFolders.includes(folderName as any)) {
          return f.path.startsWith(folderName);
        }
        return !registeredFolders.some((rf) => f.path.startsWith(rf));
      });
      const isCurrentlyChecked =
        folderFiles.length > 0 && folderFiles.every((f) => state.visibleFiles[f.id]);
      const targetState = !isCurrentlyChecked;
      const updated = { ...state.visibleFiles };
      folderFiles.forEach((file) => {
        updated[file.id] = targetState;
      });
      return { visibleFiles: updated };
    }),
  resetFilters: (allFiles) =>
    set(() => {
      const resetVisible: Record<string, boolean> = {};
      allFiles.forEach((f) => {
        resetVisible[f.id] = true;
      });
      return {
        visibleFiles: resetVisible,
        searchTerm: '',
        displayLevel: 'all',
      };
    }),

  // workspace.center (GraphPanel)
  codebase: demoCodebase,
  folderPositions: FOLDER_POSITIONS,
  selectedEntity: null,
  focusedNodeId: null,
  enableDownstream: true,
  enableUpstream: true,
  callersDepth: 1,
  calleesDepth: 1,
  showGrid: false,
  currentLayout: 'preset',
  attributesVisible: false,
  methodsVisible: false,
  showSelectedOnly: false,

  setCodebase: (codebase) =>
    set((state) => ({
      codebase: typeof codebase === 'function' ? codebase(state.codebase) : codebase,
    })),
  setFolderPositions: (folderPositions) => set({ folderPositions }),
  setSelectedEntity: (selectedEntity) => set({ selectedEntity }),
  setFocusedNodeId: (focusedNodeId) =>
    set((state) => ({
      focusedNodeId: typeof focusedNodeId === 'function' ? focusedNodeId(state.focusedNodeId) : focusedNodeId,
    })),
  setEnableDownstream: (val) =>
    set((state) => ({
      enableDownstream: typeof val === 'function' ? val(state.enableDownstream) : val,
    })),
  setEnableUpstream: (val) =>
    set((state) => ({
      enableUpstream: typeof val === 'function' ? val(state.enableUpstream) : val,
    })),
  setCallersDepth: (callersDepth) => set({ callersDepth }),
  setCalleesDepth: (calleesDepth) => set({ calleesDepth }),
  setShowGrid: (show) =>
    set((state) => ({
      showGrid: typeof show === 'function' ? show(state.showGrid) : show,
    })),
  setCurrentLayout: (currentLayout) => set({ currentLayout }),
  setAttributesVisible: (visible) =>
    set((state) => ({
      attributesVisible: typeof visible === 'function' ? visible(state.attributesVisible) : visible,
    })),
  setMethodsVisible: (visible) =>
    set((state) => ({
      methodsVisible: typeof visible === 'function' ? visible(state.methodsVisible) : visible,
    })),
  setShowSelectedOnly: (show) =>
    set((state) => ({
      showSelectedOnly: typeof show === 'function' ? show(state.showSelectedOnly) : show,
    })),

  // workspace.right (TabsFilesContextContainer & Panels)
  rightPanelTab: 'files_context',
  selectedContextFiles: {},
  expandedContextGroups: {},

  setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
  setSelectedContextFiles: (files) =>
    set((state) => ({
      selectedContextFiles: typeof files === 'function' ? files(state.selectedContextFiles) : files,
    })),
  toggleContextFileCheckbox: (fileId) =>
    set((state) => ({
      selectedContextFiles: {
        ...state.selectedContextFiles,
        [fileId]: !state.selectedContextFiles[fileId],
      },
    })),
  setExpandedContextGroups: (groups) =>
    set((state) => ({
      expandedContextGroups: typeof groups === 'function' ? groups(state.expandedContextGroups) : groups,
    })),

  // workspace.right ContextTransformer State
  transformerRules: DEFAULT_ANONYMIZATION_RULES,
  setTransformerRules: (transformerRules) =>
    set((state) => ({
      transformerRules:
        typeof transformerRules === 'function'
          ? transformerRules(state.transformerRules)
          : transformerRules,
    })),

  // Shared FilesCtxExportPanel State
  exportFormat: 'yaml',
  maxChunk: '0',
  splitChunkByFileExtension: false,
  copyAsFilesToClipboard: false,
  targetFilePaths: [],

  setExportFormat: (exportFormat) => set({ exportFormat }),
  setMaxChunk: (maxChunk) => set({ maxChunk }),
  setSplitChunkByFileExtension: (splitChunkByFileExtension) =>
    set({ splitChunkByFileExtension }),
  setCopyAsFilesToClipboard: (copyAsFilesToClipboard) =>
    set({ copyAsFilesToClipboard }),
  setTargetFilePaths: (targetFilePaths) => set({ targetFilePaths }),

  // sidebarRight: Navigation
  promptTab: 'prompt',
  setPromptTab: (promptTab) => set({ promptTab }),

  // sidebarRight: Prompt Builder & Config
  config: INITIAL_CONFIG,
  promptFields: INITIAL_PROMPT_FIELDS,
  updateConfig: (partial) =>
    set((state) => ({ config: { ...state.config, ...partial } })),
  updatePromptFields: (partial) =>
    set((state) => ({ promptFields: { ...state.promptFields, ...partial } })),
  resetPromptFields: () => set({ promptFields: INITIAL_PROMPT_FIELDS }),
  getFullPrompt: () => {
    const { promptFields, config } = get();
    const roleHeader =
      promptFields.mode === 'agent'
        ? `[AGENT]: ${promptFields.selectedAgent} (${promptFields.roleOrAgent})`
        : `[ROLE]: ${promptFields.roleOrAgent}`;

    return `${config.systemPromptPrefix}

${roleHeader}

[TONE]
${promptFields.tone}

[CONTEXT]
${promptFields.context}

[EXPECTED]
${promptFields.expected}

[OUTPUT FORMAT]
${promptFields.output}

[SAMPLES / EXAMPLES]
${promptFields.samples}`;
  },

  // sidebarRight: LLM Explorer Chat
  llmProvider: LlmProvider.OLLAMA,
  llmSelectedModel: '',
  llmMessages: [],
  llmInputPrompt: '',
  llmTemperature: 0.7,
  llmAttachedFiles: [],
  llmFilePathInput: '',
  llmExpandedCards: {},

  setLlmProvider: (llmProvider) => set({ llmProvider }),
  setLlmSelectedModel: (llmSelectedModel) => set({ llmSelectedModel }),
  setLmMessages: (llmMessages) =>
    set((state) => ({
      llmMessages: typeof llmMessages === 'function' ? llmMessages(state.llmMessages) : llmMessages,
    })),
  setLlmInputPrompt: (llmInputPrompt) => set({ llmInputPrompt }),
  setLlmTemperature: (llmTemperature) => set({ llmTemperature }),
  setLlmAttachedFiles: (llmAttachedFiles) =>
    set((state) => ({
      llmAttachedFiles: typeof llmAttachedFiles === 'function' ? llmAttachedFiles(state.llmAttachedFiles) : llmAttachedFiles,
    })),
  setLlmFilePathInput: (llmFilePathInput) => set({ llmFilePathInput }),
  setLlmExpandedCard: (cardId, expanded) =>
    set((state) => ({
      llmExpandedCards: { ...state.llmExpandedCards, [cardId]: expanded },
    })),
  toggleLlmExpandedCard: (cardId) =>
    set((state) => ({
      llmExpandedCards: {
        ...state.llmExpandedCards,
        [cardId]: !(state.llmExpandedCards[cardId] ?? true),
      },
    })),
  setLlmExpandedCards: (cards) =>
    set((state) => ({
      llmExpandedCards: typeof cards === 'function' ? cards(state.llmExpandedCards) : cards,
    })),
}));

// ============================================================================
// Whitelisted Persistent State Keys
// (Prevents heavy AST graph models & chat messages from blocking main thread)
// ============================================================================

const PERSISTED_KEYS: (keyof ExplorerState)[] = [
  'dataWorkflow',
  'config',
  'promptFields',
  'transformerRules',
  'exportFormat',
  'maxChunk',
  'splitChunkByFileExtension',
  'copyAsFilesToClipboard',
  'upstreamDepth',
  'downstreamDepth',
  'callersDepth',
  'calleesDepth',
  'enableUpstream',
  'enableDownstream',
  'rightPanelTab',
  'promptTab',
  'llmProvider',
  'llmSelectedModel',
  'llmTemperature',
];

// ============================================================================
// Store Persistence Synchronization (Non-blocking Async UI Execution)
// ============================================================================

let isHydrating = false;
let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let lastPersistedHash = '';

// 1. Read & Hydrate store from VS Code user preferences asynchronously on initialization
const hydrateStore = async () => {
  try {
    isHydrating = true;
    const userPrefs: any = await vsCodeApiService.readUserPreferences(
      VsCodeSettingsKeys.graphRagExplorer.userPreferences
    );
    logInfo('Read user preferences for store hydration:', userPrefs);

    if (userPrefs && typeof userPrefs === 'object' && Object.keys(userPrefs).length > 0) {
      useExplorerStore.setState(userPrefs);
      logInfo('Zustand Store initialized with hydrated state from user preferences.');
    }
  } catch (error: any) {
    logError('Failed to read user preferences for store hydration:', error);
  } finally {
    isHydrating = false;
  }
};

hydrateStore();

// 2. Optimized Non-blocking subscriber using Microtasks + Whitelist filtering
useExplorerStore.subscribe((state) => {
  if (isHydrating) return;

  if (saveDebounceTimer) {
    clearTimeout(saveDebounceTimer);
  }

  saveDebounceTimer = setTimeout(() => {
    // Schedule state extraction and save off the synchronous UI render cycle
    queueMicrotask(() => {
      const payload: Record<string, any> = {};

      for (const key of PERSISTED_KEYS) {
        const val = state[key];
        if (val !== undefined && typeof val !== 'function') {
          payload[key] = val;
        }
      }

      // Fast stringify check to avoid posting unchanged payloads over VS Code postMessage RPC
      const currentHash = JSON.stringify(payload);
      if (currentHash === lastPersistedHash) return;
      lastPersistedHash = currentHash;

      vsCodeApiService
        .saveUserPreferences(
          VsCodeSettingsKeys.graphRagExplorer.userPreferences,
          payload
        )
        .then(() => {
          logInfo('Saved user preferences asynchronously for key: tokenRazor.graphRagExplorer.userPreferences');
        })
        .catch((error: any) => {
          logError('Failed to save user preferences asynchronously:', error);
        });
    });
  }, 600);
});

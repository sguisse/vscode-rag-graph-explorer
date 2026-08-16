#!/usr/bin/env bash
set -e

echo "🚀 Integrating graph-rag-explorer-store and persistent LLM chat state into useExplorerStore..."

# 1. Remove obsolete graph-rag-explorer-store.ts file
rm -f webview/src/features/explorer/sdb-rgt-prompt/graph-rag-explorer-store.ts

# 2. Update useExplorerStore.ts with modular interfaces for prompt builder, config, and LLM chat
cat << 'EOF' > webview/src/features/explorer/store/useExplorerStore.ts
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
import { initialCodebase, FOLDER_POSITIONS } from '../wksp-cnt-graph/data/GraphData';
import { INITIAL_VISIBLE_FILES_CONFIG, FOLDER_KEYS_REGISTERED_CONFIG } from '../constants/graph.constants';

// ============================================================================
// Data Types & Schemas
// ============================================================================

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

/**
 * State & Actions for Container: workspace.top
 * Panel: ImpactedPathsPanel
 */
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

/**
 * State & Actions for Container: workspace.left
 * Panel: CodebaseExplorerPanel
 */
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

/**
 * State & Actions for Container: workspace.center
 * Panel: GraphPanel
 */
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

/**
 * State & Actions for Container: workspace.right
 * Panels: TabsFilesContextContainer (FilesContextPanel, InspectorPanel, ContextTransformerPanel)
 */
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

/**
 * State & Actions for Container: sidebarRight
 * Tab navigation state
 */
export interface SdbRgtPromptTabState {
  promptTab: 'prompt' | 'llm' | 'config';
  setPromptTab: (tab: 'prompt' | 'llm' | 'config') => void;
}

/**
 * State & Actions for Panel: PromptPanel & ConfigurationPanel
 */
export interface SdbRgtPromptBuilderState {
  config: GraphRagExplorerConfig;
  promptFields: PromptFields;
  updateConfig: (partial: Partial<GraphRagExplorerConfig>) => void;
  updatePromptFields: (partial: Partial<PromptFields>) => void;
  resetPromptFields: () => void;
  getFullPrompt: () => string;
}

/**
 * State & Actions for Panel: LLMExplorerChat
 */
export interface SdbRgtLlmChatState {
  llmProvider: LlmProvider;
  llmSelectedModel: string;
  llmMessages: IChatMessageDto[];
  llmInputPrompt: string;
  llmTemperature: number;
  llmAttachedFiles: IFileContextDto[];
  llmFilePathInput: string;

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
}

// ============================================================================
// Consolidated Explorer Feature State Interface
// ============================================================================

export interface ExplorerState
  extends WkpTopImpactedPathsState,
    WkpLftCodebaseTreeState,
    WkspCntGraphState,
    WkpRgtTabsFilesContextState,
    SdbRgtPromptTabState,
    SdbRgtPromptBuilderState,
    SdbRgtLlmChatState {}

// ============================================================================
// Store Implementation
// ============================================================================

export const useExplorerStore = create<ExplorerState>((set, get) => ({
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
  codebase: initialCodebase,
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
}));
EOF

# 3. Update use-configuration.ts to import from useExplorerStore
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/hooks/use-configuration.ts
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../store/useExplorerStore';

export function useConfiguration() {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const config = useExplorerStore((s) => s.config);
  const updateConfig = useExplorerStore((s) => s.updateConfig);

  const handleSaveConfig = () => {
    setNotification(`✅ Configuration saved to local backend JSON: ${config.backendConfigPath}`);
  };

  return {
    config,
    updateConfig,
    handleSaveConfig,
  };
}
EOF

# 4. Update use-prompt.ts to import from useExplorerStore
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/hooks/use-prompt.ts
import { useState } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../store/useExplorerStore';
import PREDEFINED_PROMPTS from '../data/predefined-prompts.yaml';
import TEMPLATE_PROMPTS from '../data/template-prompts.yaml';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function usePrompt(handleCopy?: (text: string, message: string) => void) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const promptFields = useExplorerStore((s) => s.promptFields);
  const config = useExplorerStore((s) => s.config);
  const updatePromptFields = useExplorerStore((s) => s.updatePromptFields);
  const getFullPrompt = useExplorerStore((s) => s.getFullPrompt);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    TEMPLATE_PROMPTS[0]?.id || ''
  );

  const notify = (msg: string) => {
    if (handleCopy) {
      handleCopy('', msg);
    } else {
      setNotification(msg);
    }
  };

  const handlePredefinedChange = (presetId: string) => {
    const found = PREDEFINED_PROMPTS.find((p: any) => p.id === presetId);
    if (found) {
      updatePromptFields({
        ...found.data,
        mode: found.data.mode as 'role' | 'agent',
        predefined: presetId,
      });
      notify(`Loaded predefined template: ${found.name}`);
    } else {
      updatePromptFields({ predefined: presetId });
    }
  };

  const handleCopyPrompt = async () => {
    const templateItem = TEMPLATE_PROMPTS.find((t: any) => t.id === selectedTemplateId);
    let fullPrompt = '';

    if (templateItem && templateItem.data) {
      const roleHeader =
        promptFields.mode === 'agent'
          ? `[AGENT]: ${promptFields.selectedAgent} (${promptFields.roleOrAgent})`
          : `${promptFields.roleOrAgent}`;

      const replacements: Record<string, string> = {
        '{{ ROLE_AGENT }}': roleHeader,
        '{{ TONE }}': promptFields.tone || '',
        '{{ GLOBAL_CONTEXT_SCOPE }}': config.systemPromptPrefix || '',
        '{{ TASK_CONTEXT_SCOPE }}': promptFields.context || '',
        '{{ EXPECTED_DELIVERABLES }}': promptFields.expected || '',
        '{{ OUTPUT_FORMAT_CONSTRAINTS }}': promptFields.output || '',
        '{{ REFERENCE_SAMPLES }}': promptFields.samples || '',
      };

      fullPrompt = templateItem.data;
      Object.entries(replacements).forEach(([key, value]) => {
        fullPrompt = fullPrompt.replaceAll(key, value);
      });
    } else {
      fullPrompt = getFullPrompt();
    }

    logInfo(`Full prompt generated: ${fullPrompt}`);

    try {
      await vsCodeApiService.copyToClipboard(fullPrompt);
      setNotification('✅ Full prompt copied to clipboard!');
    } catch {
      setNotification('❌ Failed to copy prompt to clipboard');
    }
  };

  const handleInsertAgent = () => {
    updatePromptFields({ roleOrAgent: `${promptFields.selectedAgent}: ${promptFields.roleOrAgent}` });
    notify(`Inserted agent ${promptFields.selectedAgent} into field!`);
  };

  return {
    promptFields,
    updatePromptFields,
    selectedTemplateId,
    setSelectedTemplateId,
    handlePredefinedChange,
    handleCopyPrompt,
    handleInsertAgent,
  };
}
EOF

# 5. Update use-llm-chat.ts to use persistent LLM state in useExplorerStore
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/hooks/use-llm-chat.ts
import { useState, useEffect } from 'react';
import {
  LlmProvider,
  IChatMessageDto,
  ILlmModelInfo,
  IFileContextDto,
} from '@/shared/services/llm-chat';
import { llmChatApiService } from '@/services/api/llm-chat-api.service.gen';
import { useExplorerStore } from '../../store/useExplorerStore';

const logInfo = (message: string, ...meta: any[]) => {
  console.log(`[LLMExplorerChat UI] ℹ️ ${message}`, meta.length ? meta : '');
};

export function formatExecutionTime(timeMs?: number): string {
  if (!timeMs || timeMs < 0) return '00m:00s';
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
}

export function formatDateTime(timestamp?: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

export function formatTokenCount(count?: number): string {
  if (count === undefined || count === null || isNaN(count) || count < 0) return '0';
  if (count > 999999) {
    return `${(count / 1000000).toFixed(1)} MB`;
  }
  if (count > 9999) {
    return `${(count / 1000).toFixed(1)} KB`;
  }
  if (count > 999) {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return count.toString();
}

export function formatPromptWithContext(instruction: string, files: IFileContextDto[]): string {
  if (!files || files.length === 0) {
    return instruction;
  }

  const fileBlocks = files
    .map((f) => `  <file path="${f.path}">\n${f.content || '// Content unavailable'}\n  </file>`)
    .join('\n');

  return `<context>\n${fileBlocks}\n</context>\n\n<instruction>\n  ${instruction}\n</instruction>`;
}

export function parseUserMessageContent(content: string) {
  const contextMatch = content.match(/<context>([\s\S]*?)<\/context>/);
  const instructionMatch = content.match(/<instruction>([\s\S]*?)<\/instruction>/);

  if (contextMatch || instructionMatch) {
    return {
      contextText: contextMatch ? contextMatch[0].trim() : null,
      instructionText: instructionMatch
        ? instructionMatch[1].trim()
        : content.replace(/<context>[\s\S]*?<\/context>/, '').trim(),
    };
  }

  return {
    contextText: null,
    instructionText: content,
  };
}

export function useLlmChat() {
  const provider = useExplorerStore((s) => s.llmProvider);
  const setProvider = useExplorerStore((s) => s.setLlmProvider);
  const selectedModel = useExplorerStore((s) => s.llmSelectedModel);
  const setSelectedModel = useExplorerStore((s) => s.setLlmSelectedModel);
  const messages = useExplorerStore((s) => s.llmMessages);
  const setMessages = useExplorerStore((s) => s.setLmMessages);
  const inputPrompt = useExplorerStore((s) => s.llmInputPrompt);
  const setInputPrompt = useExplorerStore((s) => s.setLlmInputPrompt);
  const temperature = useExplorerStore((s) => s.llmTemperature);
  const setTemperature = useExplorerStore((s) => s.setLlmTemperature);
  const attachedFiles = useExplorerStore((s) => s.llmAttachedFiles);
  const setAttachedFiles = useExplorerStore((s) => s.setLlmAttachedFiles);
  const filePathInput = useExplorerStore((s) => s.llmFilePathInput);
  const setFilePathInput = useExplorerStore((s) => s.setLlmFilePathInput);

  const [models, setModels] = useState<ILlmModelInfo[]>([]);
  const [systemPrompt] = useState<string>('You are an expert Graph RAG Assistant.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);

  useEffect(() => {
    logInfo('Provider selection updated. Fetching models...', { provider });
    loadModels(provider);
  }, [provider]);

  const loadModels = async (prov: LlmProvider) => {
    try {
      const available = await llmChatApiService.listAvailableModels(prov);
      logInfo('Models loaded for provider', { provider: prov, count: available.length });
      setModels(available);
      if (available.length > 0) {
        if (!selectedModel || !available.some((m) => m.id === selectedModel)) {
          setSelectedModel(available[0].id);
        }
      } else {
        setSelectedModel('');
      }
    } catch (err: any) {
      logInfo('Failed to load models for provider', { provider: prov, error: err?.message });
      setModels([]);
    }
  };

  const handleAddFileContext = async () => {
    const trimmedPath = filePathInput.trim();
    if (!trimmedPath) return;

    if (attachedFiles.some((f) => f.path === trimmedPath)) {
      logInfo('File path already attached as context', { path: trimmedPath });
      setFilePathInput('');
      return;
    }

    setIsReadingFile(true);
    logInfo('Attaching file path context...', { path: trimmedPath });

    try {
      const content = await llmChatApiService.readFileContent(trimmedPath);
      setAttachedFiles((prev) => [...prev, { path: trimmedPath, content }]);
      logInfo('Successfully attached file content', { path: trimmedPath, chars: content.length });
    } catch (err: any) {
      logInfo('Error reading file content. Adding fallback entry.', { path: trimmedPath, error: err?.message });
      setAttachedFiles((prev) => [...prev, { path: trimmedPath, content: `// Unable to load ${trimmedPath}` }]);
    } finally {
      setFilePathInput('');
      setIsReadingFile(false);
    }
  };

  const handleRemoveFileContext = (pathToRemove: string) => {
    logInfo('Removing attached file context', { path: pathToRemove });
    setAttachedFiles((prev) => prev.filter((f) => f.path !== pathToRemove));
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isLoading) return;

    const requestTimestamp = Date.now();
    const formattedPrompt = formatPromptWithContext(inputPrompt, attachedFiles);
    const contextFileCount = attachedFiles.length;

    logInfo('User submitted chat prompt with context', {
      provider,
      model: selectedModel,
      contextFilesCount: contextFileCount,
      rawPromptLength: inputPrompt.length,
      formattedPromptLength: formattedPrompt.length,
      timestamp: requestTimestamp,
    });

    const userMessage: IChatMessageDto = {
      id: `user-${requestTimestamp}`,
      role: 'user',
      content: formattedPrompt,
      timestamp: requestTimestamp,
      fileCount: contextFileCount,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await llmChatApiService.executeChat({
        provider,
        model: selectedModel,
        messages: newMessages,
        systemPrompt,
        fileContexts: attachedFiles,
        temperature,
      });

      if (response.error) {
        logInfo('Chat response received with error', { error: response.error });
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ Error: ${response.error}`,
            timestamp: Date.now(),
            provider: response.provider || provider,
            model: response.model || selectedModel,
          },
        ]);
      } else {
        logInfo('Chat response received successfully', {
          messageId: response.messageId,
          provider: response.provider,
          model: response.model,
          executionTimeMs: response.executionTimeMs,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: response.messageId,
            role: 'assistant',
            content: response.content,
            timestamp: Date.now(),
            provider: response.provider || provider,
            model: response.model || selectedModel,
            promptTokens: response.promptTokens,
            completionTokens: response.completionTokens,
            totalTokens: response.totalTokens,
            executionTimeMs: response.executionTimeMs,
          },
        ]);
      }
    } catch (err: any) {
      logInfo('Chat request failed with exception', { error: err?.message });
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `❌ Communication Failure: ${err?.message || 'Unknown error'}`,
          timestamp: Date.now(),
          provider,
          model: selectedModel,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    provider,
    setProvider,
    models,
    selectedModel,
    setSelectedModel,
    messages,
    inputPrompt,
    setInputPrompt,
    temperature,
    setTemperature,
    attachedFiles,
    filePathInput,
    setFilePathInput,
    isReadingFile,
    isLoading,
    handleAddFileContext,
    handleRemoveFileContext,
    handleSend,
  };
}
EOF

echo "✅ refactor: Integrated graph-rag-explorer-store and persistent LLM chat state into useExplorerStore and removed obsolete store file!"

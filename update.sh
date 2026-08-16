#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Integrating collapsible card expand/collapse persistence into Zustand store..."

# 1. Update useExplorerStore.ts to hold llmExpandedCards state
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
import { ExportFormat } from '@/shared/services/codebase-exporter/domain/model/types';
import { demoCodebase, FOLDER_POSITIONS } from '../wksp-cnt-graph/data/GraphData';
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
  extends WkpTopImpactedPathsState,
    WkpLftCodebaseTreeState,
    WkspCntGraphState,
    WkpRgtTabsFilesContextState,
    FilesCtxExportState,
    SdbRgtPromptTabState,
    SdbRgtPromptBuilderState,
    SdbRgtLlmChatState {}

// ============================================================================
// Store Implementation
// ============================================================================

export const useExplorerStore = create<ExplorerState>((set, get) => ({
  // workspace.top
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

  // workspace.left
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

  // workspace.center
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

  // workspace.right
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
EOF

# 2. Update collapsible-card.tsx to support controlled expansion via store
cat << 'EOF' > webview/src/components/app/collapsible-card.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Copy, Check } from 'lucide-react';

export const CopyButton: React.FC<{ text: string; title?: string; className?: string }> = ({
  text,
  title = 'Copy content',
  className,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleCopy}
      data-tooltip={title}
      className={cn(
        "w-6 h-6 p-0 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
        className
      )}
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
    </Button>
  );
};

export interface CollapsibleCardProps {
  cardId?: string;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  title: React.ReactNode;
  badge?: string;
  defaultExpanded?: boolean;
  globalExpanded?: { value: boolean; id: number };
  contentToCopy: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  footer?: React.ReactNode;
  footerStyle?: React.CSSProperties;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  cardId,
  isOpen: externalIsOpen,
  onToggle,
  title,
  badge,
  defaultExpanded = true,
  globalExpanded,
  contentToCopy,
  children,
  className,
  style,
  headerClassName,
  headerStyle,
  footer,
  footerStyle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultExpanded);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const handleCardToggle = () => {
    const nextState = !isOpen;
    if (onToggle) {
      onToggle(nextState);
    } else {
      setInternalIsOpen(nextState);
    }
  };

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (globalExpanded !== undefined) {
      if (onToggle) {
        onToggle(globalExpanded.value);
      } else {
        setInternalIsOpen(globalExpanded.value);
      }
    }
  }, [globalExpanded?.id]);

  return (
    <Card
      className={cn("flex flex-col py-0 border rounded-sm overflow-hidden shrink-0", className)}
      style={style}
    >
      <CardHeader
        onClick={handleCardToggle}
        className={cn(
          "flex flex-row justify-between items-center space-y-0 p-1.5 px-3 rounded-t-none transition-colors cursor-pointer select-none",
          headerClassName
        )}
        style={headerStyle}
      >
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span className="text-[10px]">{isOpen ? '▼' : '►'}</span>
          {typeof title === 'string' ? <span>{title}</span> : title}
          {badge && (
            <span className="bg-primary/10 px-1.5 py-0.5 rounded-sm font-semibold text-[9px] text-primary">
              {badge}
            </span>
          )}
        </div>

        <CopyButton text={contentToCopy} title="Copy block content" />
      </CardHeader>

      {isOpen && children && (
        <CardContent className="p-2.5 font-mono text-[11px] break-words leading-relaxed whitespace-pre-wrap">
          {children}
        </CardContent>
      )}

      {footer && (
        <CardFooter
          className="justify-end opacity-70 p-1 px-2.5 text-[10px] italic"
          style={footerStyle}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};
EOF

# 3. Update UserMessageBlock to connect card states with useExplorerStore
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/llm-chat/components/UserMessageBlock.tsx
import React from 'react';
import { IChatMessageDto } from '@/shared/services/llm-chat';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { parseUserMessageContent, formatDateTime } from '../../hooks/use-llm-chat';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../../store/useExplorerStore';

export const UserMessageBlock: React.FC<{
  msg: IChatMessageDto;
  globalExpanded?: { value: boolean; id: number };
}> = ({ msg, globalExpanded }) => {
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const expandedCards = useExplorerStore((s) => s.llmExpandedCards);
  const setLlmExpandedCard = useExplorerStore((s) => s.setLlmExpandedCard);

  const mainCardId = `user-${msg.id}`;
  const contextCardId = `user-ctx-${msg.id}`;
  const promptCardId = `user-inst-${msg.id}`;

  const isMainOpen = expandedCards[mainCardId] ?? true;
  const isContextOpen = expandedCards[contextCardId] ?? false;
  const isPromptOpen = expandedCards[promptCardId] ?? true;

  const { contextText, instructionText } = parseUserMessageContent(msg.content);

  // User Message Main Block Adaptive Colors
  const userBg = isDarkMode
    ? 'color-mix(in srgb, var(--blue-7, #082a8f) 25%, var(--card))'
    : 'color-mix(in srgb, var(--blue-1, #bcecff) 18%, var(--card))';
  const userBgHeader = isDarkMode
    ? 'color-mix(in srgb, var(--blue-6, #1530b7) 40%, var(--card))'
    : 'color-mix(in srgb, var(--blue-2, #8dd6ff) 35%, var(--card))';
  const userBorder = isDarkMode
    ? 'color-mix(in srgb, var(--blue-4, #0377ff) 45%, var(--border))'
    : 'color-mix(in srgb, var(--blue-3, #5fb9ff) 40%, var(--border))';

  // Shared Sub-Card Colors
  const subCardBg = isDarkMode
    ? 'color-mix(in srgb, var(--black-0, #000000) 30%, var(--card))'
    : 'color-mix(in srgb, var(--white-0, #ffffff) 65%, var(--card))';
  const subCardHeader = isDarkMode
    ? 'color-mix(in srgb, var(--gray-7, #191f1b) 60%, var(--card))'
    : 'color-mix(in srgb, var(--gray-0, #f2f5f3) 85%, var(--card))';
  const subCardBorder = isDarkMode
    ? 'color-mix(in srgb, var(--gray-4, #58635b) 40%, var(--border))'
    : 'color-mix(in srgb, var(--gray-2, #d2d9d4) 60%, var(--border))';

  return (
    <CollapsibleCard
      cardId={mainCardId}
      isOpen={isMainOpen}
      onToggle={(isOpen) => setLlmExpandedCard(mainCardId, isOpen)}
      title={
        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 text-xs">
          👤 USER Request
        </span>
      }
      defaultExpanded={true}
      globalExpanded={globalExpanded}
      contentToCopy={msg.content}
      className="self-end w-full max-w-[90%]"
      style={{
        backgroundColor: userBg,
        borderColor: userBorder,
        color: 'var(--foreground)',
      }}
      headerStyle={{
        backgroundColor: userBgHeader,
        borderBottom: `1px solid ${userBorder}`,
      }}
      footerStyle={{
        borderTop: `1px dashed ${userBorder}`,
      }}
      footer={`${formatDateTime(msg.timestamp)} | Context Files: ${msg.fileCount ?? 0}`}
    >
      <div className="flex flex-col gap-1.5">
        {contextText && (
          <CollapsibleCard
            cardId={contextCardId}
            isOpen={isContextOpen}
            onToggle={(isOpen) => setLlmExpandedCard(contextCardId, isOpen)}
            title="📄 Attached File Context"
            badge={msg.fileCount ? `${msg.fileCount} files` : 'xml'}
            defaultExpanded={false}
            globalExpanded={globalExpanded}
            contentToCopy={contextText}
            style={{
              backgroundColor: subCardBg,
              borderColor: subCardBorder,
            }}
            headerStyle={{
              backgroundColor: subCardHeader,
              borderBottom: `1px solid ${subCardBorder}`,
            }}
          >
            {contextText}
          </CollapsibleCard>
        )}

        <CollapsibleCard
          cardId={promptCardId}
          isOpen={isPromptOpen}
          onToggle={(isOpen) => setLlmExpandedCard(promptCardId, isOpen)}
          title="💬 Instruction Prompt"
          defaultExpanded={true}
          globalExpanded={globalExpanded}
          contentToCopy={instructionText}
          style={{
            backgroundColor: subCardBg,
            borderColor: subCardBorder,
          }}
          headerStyle={{
            backgroundColor: subCardHeader,
            borderBottom: `1px solid ${subCardBorder}`,
          }}
        >
          {instructionText}
        </CollapsibleCard>
      </div>
    </CollapsibleCard>
  );
};
EOF

# 4. Update AssistantMessageBlock to connect card state with useExplorerStore
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/llm-chat/components/AssistantMessageBlock.tsx
import React from 'react';
import { IChatMessageDto, LlmProvider } from '@/shared/services/llm-chat';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { formatTokenCount, formatExecutionTime } from '../../hooks/use-llm-chat';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../../store/useExplorerStore';

export const AssistantMessageBlock: React.FC<{
  msg: IChatMessageDto;
  fallbackProvider: LlmProvider;
  fallbackModel: string;
  globalExpanded?: { value: boolean; id: number };
}> = ({ msg, fallbackProvider, fallbackModel, globalExpanded }) => {
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const expandedCards = useExplorerStore((s) => s.llmExpandedCards);
  const setLlmExpandedCard = useExplorerStore((s) => s.setLlmExpandedCard);

  const cardId = `asst-${msg.id}`;
  const isOpen = expandedCards[cardId] ?? true;

  // Assistant Response Block Adaptive Colors (Yellow / Amber palette)
  const assistantBg = isDarkMode
    ? 'color-mix(in srgb, var(--yellow-7, #653200) 25%, var(--card))'
    : 'color-mix(in srgb, var(--yellow-0, #fff8c5) 35%, var(--card))';
  const assistantBgHeader = isDarkMode
    ? 'color-mix(in srgb, var(--yellow-6, #834800) 45%, var(--card))'
    : 'color-mix(in srgb, var(--yellow-1, #f7d162) 40%, var(--card))';
  const assistantBorder = isDarkMode
    ? 'color-mix(in srgb, var(--yellow-2, #fabf21) 50%, var(--border))'
    : 'color-mix(in srgb, var(--yellow-3, #db9d00) 45%, var(--border))';

  const showFooter = msg.promptTokens !== undefined || msg.executionTimeMs !== undefined;

  return (
    <CollapsibleCard
      cardId={cardId}
      isOpen={isOpen}
      onToggle={(openState) => setLlmExpandedCard(cardId, openState)}
      title={
        <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 text-xs">
          🤖 {(msg.provider || fallbackProvider).toUpperCase()} ({msg.model || fallbackModel})
        </span>
      }
      defaultExpanded={true}
      globalExpanded={globalExpanded}
      contentToCopy={msg.content}
      className="self-start w-full max-w-[85%]"
      style={{
        backgroundColor: assistantBg,
        borderColor: assistantBorder,
        color: 'var(--foreground)',
      }}
      headerStyle={{
        backgroundColor: assistantBgHeader,
        borderBottom: `1px solid ${assistantBorder}`,
      }}
      footerStyle={{
        borderTop: `1px dashed ${assistantBorder}`,
      }}
      footer={
        showFooter
          ? `In: ${formatTokenCount(msg.promptTokens)} tokens | Out: ${formatTokenCount(msg.completionTokens)} tokens | Time: ${formatExecutionTime(msg.executionTimeMs)}`
          : undefined
      }
    >
      <div className="font-sans text-xs break-words leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </div>
    </CollapsibleCard>
  );
};
EOF

# 5. Update use-llm-chat.ts to sync Expand All / Collapse All with Zustand store
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/hooks/use-llm-chat.ts
import { useState, useEffect, useRef } from 'react';
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
  const setLlmExpandedCards = useExplorerStore((s) => s.setLlmExpandedCards);

  const [models, setModels] = useState<ILlmModelInfo[]>([]);
  const [systemPrompt] = useState<string>('You are an expert Graph RAG Assistant.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);
  const [globalExpanded, setGlobalExpanded] = useState<{ value: boolean; id: number } | undefined>(undefined);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logInfo('Provider selection updated. Fetching models...', { provider });
    loadModels(provider);
  }, [provider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadModels = async (prov: LlmProvider) => {
    try {
      const available = await llmChatApiService.listAvailableModels(prov);
      logInfo('Models loaded for provider', { provider: prov, count: available.length });
      setModels(available);
      if (available.length > 0) {
        const preferredModel = prov === LlmProvider.OLLAMA ? 'qwen2.5-coder:1.5b' : available[0].id;
        const matchingModel = available.find(
          (m) => m.id === preferredModel || m.name === preferredModel
        );
        const targetModelId = matchingModel ? matchingModel.id : available[0].id;

        if (!selectedModel || !available.some((m) => m.id === selectedModel)) {
          setSelectedModel(targetModelId);
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
    } fontinally {
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

    setGlobalExpanded(undefined);

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

  const handleScrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToBottom = () => {
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleExpandAll = () => {
    setGlobalExpanded({ value: true, id: Date.now() });
    setLlmExpandedCards((prev) => {
      const updated: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        updated[k] = true;
      });
      messages.forEach((m) => {
        updated[`user-${m.id}`] = true;
        updated[`user-ctx-${m.id}`] = true;
        updated[`user-inst-${m.id}`] = true;
        updated[`asst-${m.id}`] = true;
      });
      return updated;
    });
  };

  const handleCollapseAll = () => {
    setGlobalExpanded({ value: false, id: Date.now() });
    setLlmExpandedCards((prev) => {
      const updated: Record<string, boolean> = {};
      Object.keys(prev).forEach((k) => {
        updated[k] = false;
      });
      messages.forEach((m) => {
        updated[`user-${m.id}`] = false;
        updated[`user-ctx-${m.id}`] = false;
        updated[`user-inst-${m.id}`] = false;
        updated[`asst-${m.id}`] = false;
      });
      return updated;
    });
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
    globalExpanded,
    scrollContainerRef,
    messagesEndRef,
    handleAddFileContext,
    handleRemoveFileContext,
    handleSend,
    handleScrollToTop,
    handleScrollToBottom,
    handleExpandAll,
    handleCollapseAll,
  };
}
EOF

echo "✅ state: Successfully persisted CollapsibleCard expand/collapse states in useExplorerStore!"

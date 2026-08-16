import { create } from 'zustand';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';
import { initialCodebase, FOLDER_POSITIONS } from '../wksp-cnt-graph/components/graph/GraphData';
import { INITIAL_VISIBLE_FILES_CONFIG, FOLDER_KEYS_REGISTERED_CONFIG } from '../constants/graph.constants';

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
 * Panels: TabsPromptContainer (PromptPanel, LLMExplorerChat, ConfigurationPanel)
 */
export interface SdbRgtPromptState {
  promptTab: 'prompt' | 'llm' | 'config';
  setPromptTab: (tab: 'prompt' | 'llm' | 'config') => void;
}

// ============================================================================
// Consolidated Explorer Feature State Interface
// ============================================================================

export interface ExplorerState
  extends WkpTopImpactedPathsState,
    WkpLftCodebaseTreeState,
    WkspCntGraphState,
    WkpRgtTabsFilesContextState,
    SdbRgtPromptState {}

// ============================================================================
// Store Implementation
// ============================================================================

export const useExplorerStore = create<ExplorerState>((set) => ({
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

  // sidebarRight (TabsPromptContainer & Panels)
  promptTab: 'prompt',
  setPromptTab: (promptTab) => set({ promptTab }),
}));

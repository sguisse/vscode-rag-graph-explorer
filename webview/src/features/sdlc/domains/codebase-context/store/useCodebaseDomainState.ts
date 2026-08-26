import { create } from 'zustand';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';
import { demoCodebase } from '../components/dependency-graph/data/GraphData';

// -----------------------------------------------------------------------------
// 1. Impacted Paths Panel State
// -----------------------------------------------------------------------------
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

// -----------------------------------------------------------------------------
// 2. Codebase Explorer Tree Panel State
// -----------------------------------------------------------------------------
export interface CodebaseTreePanelState {
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: (folders: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  toggleFolder: (folderKey: string) => void;
}

// -----------------------------------------------------------------------------
// 3. Dependency Graph Panel State
// -----------------------------------------------------------------------------
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
}

// -----------------------------------------------------------------------------
// 4. Files Selection & Inspector Panel State
// -----------------------------------------------------------------------------
export interface FilesContextPanelState {
  selectedEntity: any | null;
  setSelectedEntity: (entity: any | null) => void;
  targetFilePaths: string[];
  setTargetFilePaths: (paths: string[]) => void;
  selectedContextFiles: Record<string, boolean>;
  setSelectedContextFiles: (files: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  selectAllFiles: () => void;
  toggleFileCheckbox: (id: string) => void;
  toggleFolderCheckbox: (folderKey: string) => void;
  expandedContextGroups: Record<string, boolean>;
  setExpandedContextGroups: (groups: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
}

// -----------------------------------------------------------------------------
// Composite Domain Store Interface
// -----------------------------------------------------------------------------
export interface CodebaseDomainState
  extends ImpactedPathsPanelState,
    CodebaseTreePanelState,
    DependencyGraphPanelState,
    FilesContextPanelState {}

// -----------------------------------------------------------------------------
// Store Implementation
// -----------------------------------------------------------------------------
export const useCodebaseDomainState = create<CodebaseDomainState>((set) => ({
  // --- Impacted Paths Slice ---
  currentPath: '',
  setCurrentPath: (path) =>
    set((s) => {
      const allSelected: Record<string, boolean> = {};
      (s.codebase?.files || []).forEach((f: any) => {
        allSelected[f.id] = true;
      });
      return { currentPath: path, selectedContextFiles: allSelected };
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
      return { paths: newPaths, selectedContextFiles: allSelected };
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
    set({ codebase: data, selectedContextFiles: allSelected });
  },

  // --- Codebase Tree Slice ---
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
  displayLevel: 'detailed',
  setDisplayLevel: (level) => set({ displayLevel: level }),

  // --- Files Context & Inspector Slice ---
  selectedEntity: null,
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
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
      return { selectedContextFiles: allSelected };
    }),

  toggleFileCheckbox: (id) =>
    set((s) => ({
      selectedContextFiles: {
        ...s.selectedContextFiles,
        [id]: !s.selectedContextFiles[id],
      },
    })),

  toggleFolderCheckbox: (folderKey) =>
    set((s) => {
      const codebaseFiles = s.codebase?.files || [];
      const folderFiles = codebaseFiles.filter((f) => f.path.startsWith(folderKey));
      const allChecked = folderFiles.every((f) => s.selectedContextFiles[f.id]);
      const updated = { ...s.selectedContextFiles };
      folderFiles.forEach((f) => {
        updated[f.id] = !allChecked;
      });
      return { selectedContextFiles: updated };
    }),

  expandedContextGroups: {},
  setExpandedContextGroups: (groups) =>
    set((s) => ({ expandedContextGroups: typeof groups === 'function' ? groups(s.expandedContextGroups) : groups })),
}));

export const useExplorerStore = useCodebaseDomainState;

import { create } from 'zustand';
import { useSdlcSessionStore } from '../../../core/store/useSdlcSessionStore';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';
import { demoCodebase } from '../components/dependency-graph/data/GraphData';

export interface CodebaseDomainState {
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
  selectedEntity: any | null;
  setSelectedEntity: (entity: any | null) => void;
  targetFilePaths: string[];
  setTargetFilePaths: (paths: string[]) => void;

  // Checkbox Selection & Actions
  selectedContextFiles: Record<string, boolean>;
  setSelectedContextFiles: (files: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  selectAllFiles: () => void;
  toggleFileCheckbox: (id: string) => void;
  toggleFolderCheckbox: (folderKey: string) => void;

  expandedContextGroups: Record<string, boolean>;
  setExpandedContextGroups: (groups: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  expandedFolders: Record<string, boolean>;
  setExpandedFolders: (folders: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
  toggleFolder: (folderKey: string) => void;
}

export const useCodebaseDomainState = create<CodebaseDomainState>((set, get) => ({
  get currentPath() {
    const s = useSdlcSessionStore.getState();
    return s.activeSessionId && s.sessions[s.activeSessionId]
      ? s.sessions[s.activeSessionId].contextPointers.selectedEntityId || ''
      : '';
  },
  setCurrentPath: (path) => {
    useSdlcSessionStore.getState().updateActiveSession((d) => {
      d.contextPointers.selectedEntityId = path;
    });

    // Reset & select all codebase files by default on path change
    set((s) => {
      const allSelected: Record<string, boolean> = {};
      (s.codebase?.files || []).forEach((f: any) => {
        allSelected[f.id] = true;
      });
      return { selectedContextFiles: allSelected };
    });
  },

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

  get upstreamDepth() {
    const s = useSdlcSessionStore.getState();
    return s.activeSessionId && s.sessions[s.activeSessionId]
      ? s.sessions[s.activeSessionId].contextPointers.callersDepth || 2
      : 2;
  },
  setUpstreamDepth: (depth) =>
    useSdlcSessionStore.getState().updateActiveSession((d) => {
      d.contextPointers.callersDepth = depth;
    }),

  get downstreamDepth() {
    const s = useSdlcSessionStore.getState();
    return s.activeSessionId && s.sessions[s.activeSessionId]
      ? s.sessions[s.activeSessionId].contextPointers.calleesDepth || 2
      : 2;
  },
  setDownstreamDepth: (depth) =>
    useSdlcSessionStore.getState().updateActiveSession((d) => {
      d.contextPointers.calleesDepth = depth;
    }),

  codebase: demoCodebase as any,
  setCodebase: (data) => {
    // Select all files by default on codebase load / update
    const allSelected: Record<string, boolean> = {};
    (data?.files || []).forEach((f: any) => {
      allSelected[f.id] = true;
    });
    set({ codebase: data, selectedContextFiles: allSelected });
  },

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
  selectedEntity: null,
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  targetFilePaths: [],
  setTargetFilePaths: (paths) => set({ targetFilePaths: paths }),

  // File Checkbox State Management
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
}));

export const useExplorerStore = useCodebaseDomainState;

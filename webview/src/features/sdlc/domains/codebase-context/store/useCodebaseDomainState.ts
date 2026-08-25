import { create } from 'zustand';
import { useCodebaseCache } from '../../../core/store/useCodebaseCache';
import { useSdlcSessionStore } from '../../../core/store/useSdlcSessionStore';
import { CodebaseData, SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { INITIAL_VISIBLE_FILES_CONFIG, FOLDER_KEYS_REGISTERED_CONFIG } from '@/features/explorer/constants/graph.constants';
import { demoCodebase, FOLDER_POSITIONS } from '@/features/explorer/wksp-cnt-graph/data/GraphData';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

export interface CodebaseDomainState {
    codebase: CodebaseData;
    setCodebase: (ast: CodebaseData) => void;
    folderPositions: Record<string, { label: string }>;
    setFolderPositions: (pos: Record<string, { label: string }>) => void;
    selectedEntity: SelectedEntity | null;
    setSelectedEntity: (entity: SelectedEntity | null) => void;
    focusedNodeId: string | null;
    setFocusedNodeId: (id: string | null | ((prev: string | null) => string | null)) => void;
    paths: string;
    currentPath: string;
    pathsList: string[];
    upstreamDepth: number;
    downstreamDepth: number;
    setPaths: (p: string | ((prev: string) => string)) => void;
    setCurrentPath: (p: string) => void;
    setPathsList: (l: string[] | ((prev: string[]) => string[])) => void;
    setUpstreamDepth: (d: number) => void;
    setDownstreamDepth: (d: number) => void;
    searchTerm: string;
    displayLevel: string;
    maxNodesLimit: number;
    expandedFolders: Record<string, boolean>;
    visibleFiles: Record<string, boolean>;
    setSearchTerm: (t: string) => void;
    setDisplayLevel: (l: string) => void;
    setMaxNodesLimit: (l: number) => void;
    setExpandedFolders: (f: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    toggleFolder: (f: string) => void;
    setVisibleFiles: (f: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    toggleFileCheckbox: (id: string) => void;
    toggleFolderCheckbox: (folderName: string, allFiles: CodebaseFile[]) => void;
    resetFilters: (allFiles: CodebaseFile[]) => void;
    enableDownstream: boolean;
    enableUpstream: boolean;
    callersDepth: number;
    calleesDepth: number;
    showGrid: boolean;
    currentLayout: string;
    graphRendering: GraphRendering;
    attributesVisible: boolean;
    methodsVisible: boolean;
    showSelectedOnly: boolean;
    setEnableDownstream: (v: boolean | ((prev: boolean) => boolean)) => void;
    setEnableUpstream: (v: boolean | ((prev: boolean) => boolean)) => void;
    setCallersDepth: (d: number) => void;
    setCalleesDepth: (d: number) => void;
    setShowGrid: (v: boolean | ((prev: boolean) => boolean)) => void;
    setCurrentLayout: (v: string) => void;
    setGraphRendering: (v: GraphRendering) => void;
    setAttributesVisible: (v: boolean | ((prev: boolean) => boolean)) => void;
    setMethodsVisible: (v: boolean | ((prev: boolean) => boolean)) => void;
    setShowSelectedOnly: (v: boolean | ((prev: boolean) => boolean)) => void;
    selectedContextFiles: Record<string, boolean>;
    expandedContextGroups: Record<string, boolean>;
    setSelectedContextFiles: (f: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    toggleContextFileCheckbox: (id: string) => void;
    setExpandedContextGroups: (g: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    targetFilePaths: string[];
    setTargetFilePaths: (p: string[]) => void;
}

export const useCodebaseDomainState = create<CodebaseDomainState>((set, get) => ({
    get codebase() { return useCodebaseCache.getState().currentAst || demoCodebase; },
    setCodebase: (ast: CodebaseData) => {
        useCodebaseCache.getState().setAst(ast);
        set({ folderPositions: { ...get().folderPositions } });
    },
    folderPositions: FOLDER_POSITIONS,
    setFolderPositions: (pos) => set({ folderPositions: pos }),
    selectedEntity: null,
    setSelectedEntity: (entity) => {
        set({ selectedEntity: entity });
        useSdlcSessionStore.getState().updateActiveSession(draft => {
            draft.contextPointers.selectedEntityId = entity?.nodeId || null;
        });
    },
    focusedNodeId: null,
    setFocusedNodeId: (id) => set((s) => ({ focusedNodeId: typeof id === 'function' ? id(s.focusedNodeId) : id })),
    paths: '',
    currentPath: '',
    pathsList: [''],
    upstreamDepth: 2,
    downstreamDepth: 2,
    setPaths: (p) => set((s) => ({ paths: typeof p === 'function' ? p(s.paths) : p })),
    setCurrentPath: (p) => set({ currentPath: p }),
    setPathsList: (l) => set((s) => ({ pathsList: typeof l === 'function' ? l(s.pathsList) : l })),
    setUpstreamDepth: (d) => {
        set({ upstreamDepth: d });
        useSdlcSessionStore.getState().updateActiveSession(draft => { draft.contextPointers.callersDepth = d; });
    },
    setDownstreamDepth: (d) => {
        set({ downstreamDepth: d });
        useSdlcSessionStore.getState().updateActiveSession(draft => { draft.contextPointers.calleesDepth = d; });
    },
    searchTerm: '',
    displayLevel: 'all',
    maxNodesLimit: 50,
    expandedFolders: { frontend: true, backend: true, config: true, other: true },
    visibleFiles: INITIAL_VISIBLE_FILES_CONFIG,
    setSearchTerm: (t) => set({ searchTerm: t }),
    setDisplayLevel: (l) => set({ displayLevel: l }),
    setMaxNodesLimit: (l) => set({ maxNodesLimit: l }),
    setExpandedFolders: (f) => set((s) => ({ expandedFolders: typeof f === 'function' ? f(s.expandedFolders) : f })),
    toggleFolder: (f) => set((s) => ({ expandedFolders: { ...s.expandedFolders, [f]: !s.expandedFolders[f] } })),
    setVisibleFiles: (f) => set((s) => ({ visibleFiles: typeof f === 'function' ? f(s.visibleFiles) : f })),
    toggleFileCheckbox: (id) => set((s) => ({ visibleFiles: { ...s.visibleFiles, [id]: !s.visibleFiles[id] } })),
    toggleFolderCheckbox: (folderName, allFiles) => set((state) => {
        const registeredFolders = [...FOLDER_KEYS_REGISTERED_CONFIG];
        const folderFiles = allFiles.filter((f) => {
            if (registeredFolders.includes(folderName as any)) return f.path.startsWith(folderName);
            return !registeredFolders.some((rf) => f.path.startsWith(rf));
        });
        const isCurrentlyChecked = folderFiles.length > 0 && folderFiles.every((f) => state.visibleFiles[f.id]);
        const targetState = !isCurrentlyChecked;
        const updated = { ...state.visibleFiles };
        folderFiles.forEach((file) => { updated[file.id] = targetState; });
        return { visibleFiles: updated };
    }),
    resetFilters: (allFiles) => set(() => {
        const resetVisible: Record<string, boolean> = {};
        allFiles.forEach((f) => { resetVisible[f.id] = true; });
        return { visibleFiles: resetVisible, searchTerm: '', displayLevel: 'all' };
    }),
    enableDownstream: true,
    enableUpstream: true,
    callersDepth: 1,
    calleesDepth: 1,
    showGrid: false,
    currentLayout: 'cose',
    graphRendering: 'rounded',
    attributesVisible: false,
    methodsVisible: false,
    showSelectedOnly: false,
    setEnableDownstream: (v) => set((s) => ({ enableDownstream: typeof v === 'function' ? v(s.enableDownstream) : v })),
    setEnableUpstream: (v) => set((s) => ({ enableUpstream: typeof v === 'function' ? v(s.enableUpstream) : v })),
    setCallersDepth: (d) => set({ callersDepth: d }),
    setCalleesDepth: (d) => set({ calleesDepth: d }),
    setShowGrid: (v) => set((s) => ({ showGrid: typeof v === 'function' ? v(s.showGrid) : v })),
    setCurrentLayout: (v) => set({ currentLayout: v }),
    setGraphRendering: (v) => set({ graphRendering: v }),
    setAttributesVisible: (v) => set((s) => ({ attributesVisible: typeof v === 'function' ? v(s.attributesVisible) : v })),
    setMethodsVisible: (v) => set((s) => ({ methodsVisible: typeof v === 'function' ? v(s.methodsVisible) : v })),
    setShowSelectedOnly: (v) => set((s) => ({ showSelectedOnly: typeof v === 'function' ? v(s.showSelectedOnly) : v })),
    selectedContextFiles: {},
    expandedContextGroups: {},
    setSelectedContextFiles: (f) => set((s) => ({ selectedContextFiles: typeof f === 'function' ? f(s.selectedContextFiles) : f })),
    toggleContextFileCheckbox: (id) => set((s) => ({ selectedContextFiles: { ...s.selectedContextFiles, [id]: !s.selectedContextFiles[id] } })),
    setExpandedContextGroups: (g) => set((s) => ({ expandedContextGroups: typeof g === 'function' ? g(s.expandedContextGroups) : g })),
    targetFilePaths: [],
    setTargetFilePaths: (p) => set({ targetFilePaths: p })
}));
export const useExplorerStore = useCodebaseDomainState;

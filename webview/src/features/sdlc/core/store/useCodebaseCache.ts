import { create } from 'zustand';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export interface CodebaseCacheState {
    currentAst: CodebaseData | null;
    lastUpdated: number;
    setAst: (data: CodebaseData) => void;
    clearAst: () => void;
}

/**
 * Singleton Heavy AST Cache.
 * Prevents VS Code Webview Out-Of-Memory (OOM) crashes by keeping
 * the giant CodebaseData object out of the multi-session store.
 */
export const useCodebaseCache = create<CodebaseCacheState>((set) => ({
    currentAst: null,
    lastUpdated: 0,

    setAst: (data) => set({ currentAst: data, lastUpdated: Date.now() }),
    clearAst: () => set({ currentAst: null, lastUpdated: 0 })
}));

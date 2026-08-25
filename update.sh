#!/bin/bash

# ==============================================================================
# Token Razor SDLC Refactoring - Batch 1: Core Foundation
# Generates Shared Models, RPC Ports, Backend Adapters, and Zustand Stores.
# ==============================================================================

echo "🚀 Starting Batch 1 Code Generation..."

# 1. Create necessary directories
mkdir -p shared/services/sdlc-session/domain/model
mkdir -p shared/services/sdlc-session/domain/port-out
mkdir -p backend/src/services/sdlc-session
mkdir -p webview/src/features/sdlc/core/{store,workflow,vscode-sync}

# ------------------------------------------------------------------------------
# SHARED DOMAIN LAYER
# ------------------------------------------------------------------------------

echo "📦 Generating Shared Domain Models & Ports..."

cat << 'EOF' > shared/services/sdlc-session/domain/model/sdlc-session.model.ts
import { IChatMessageDto, LlmProvider } from '../../../llm-chat';

export type SdlcSessionStatus = 'draft' | 'running' | 'error' | 'success';

export interface CodebaseContextPointers {
    selectedEntityId: string | null;
    impactedNodeIds: string[];
    callersDepth: number;
    calleesDepth: number;
}

export interface InstructionsPayload {
    strategy: 'vibe' | 'bmad' | 'speckit';
    promptText: string;
}

export interface LlmChatPayload {
    provider: LlmProvider;
    selectedModel: string;
    temperature: number;
    messages: IChatMessageDto[];
}

export interface SdlcSession {
    sessionId: string;
    createdAt: number;
    updatedAt: number;
    status: SdlcSessionStatus;
    errorMessage?: string;
    activeStepId: string;
    contextPointers: CodebaseContextPointers;
    instructionsPayload: InstructionsPayload;
    llmChat: LlmChatPayload;
}
EOF

cat << 'EOF' > shared/services/sdlc-session/domain/port-out/sdlc-session-service.port.ts
import { SdlcSession } from '../model/sdlc-session.model';

export interface ISdlcSessionServicePort {
    saveSession(session: SdlcSession): Promise<void>;
    loadAllSessions(): Promise<SdlcSession[]>;
    deleteSession(sessionId: string): Promise<void>;
}
EOF

cat << 'EOF' > shared/services/sdlc-session/index.ts
export * from './domain/model/sdlc-session.model';
export * from './domain/port-out/sdlc-session-service.port';
EOF

# ------------------------------------------------------------------------------
# BACKEND ADAPTER LAYER
# ------------------------------------------------------------------------------

echo "⚙️ Generating Backend SdlcSessionAdapter..."

cat << 'EOF' > backend/src/services/sdlc-session/sdlc-session-service.adapter.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { AbstractServiceAdapter } from '../../core/AbstractServiceAdapter';
import { ISdlcSessionServicePort } from '../../../../shared/services/sdlc-session/domain/port-out/sdlc-session-service.port';
import { SdlcSession } from '../../../../shared/services/sdlc-session/domain/model/sdlc-session.model';
import { getWorkspaceExtentionPath } from '../../utils/utils-vscode';
import { logInfo, logError } from '../../utils/utils-log';

export class SdlcSessionAdapter extends AbstractServiceAdapter implements ISdlcSessionServicePort, vscode.Disposable {
    private sessionsDir: string;

    constructor() {
        super();
        this.sessionsDir = path.join(getWorkspaceExtentionPath(), 'sessions');
        this.ensureDirExists();
    }

    private ensureDirExists() {
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }

    public async saveSession(session: SdlcSession): Promise<void> {
        try {
            this.ensureDirExists();
            const filePath = path.join(this.sessionsDir, `${session.sessionId}.json`);
            await fs.promises.writeFile(filePath, JSON.stringify(session, null, 2), 'utf-8');
            logInfo(`[SdlcSessionAdapter] Session saved: ${session.sessionId}`);
        } catch (error) {
            logError(`[SdlcSessionAdapter] Failed to save session ${session.sessionId}`, error);
            throw error;
        }
    }

    public async loadAllSessions(): Promise<SdlcSession[]> {
        try {
            this.ensureDirExists();
            const files = await fs.promises.readdir(this.sessionsDir);
            const sessions: SdlcSession[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const content = await fs.promises.readFile(path.join(this.sessionsDir, file), 'utf-8');
                    sessions.push(JSON.parse(content) as SdlcSession);
                }
            }
            logInfo(`[SdlcSessionAdapter] Loaded ${sessions.length} sessions from disk.`);
            return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch (error) {
            logError(`[SdlcSessionAdapter] Failed to load sessions`, error);
            return [];
        }
    }

    public async deleteSession(sessionId: string): Promise<void> {
        try {
            const filePath = path.join(this.sessionsDir, `${sessionId}.json`);
            if (fs.existsSync(filePath)) {
                await fs.promises.unlink(filePath);
                logInfo(`[SdlcSessionAdapter] Session deleted: ${sessionId}`);
            }
        } catch (error) {
            logError(`[SdlcSessionAdapter] Failed to delete session ${sessionId}`, error);
            throw error;
        }
    }

    public dispose() {
        // Cleanup if necessary
    }
}
EOF

# ------------------------------------------------------------------------------
# FRONTEND CORE STATE (ZUSTAND)
# ------------------------------------------------------------------------------

echo "🧠 Generating Zustand Stores & Workflow Machine..."

cat << 'EOF' > webview/src/features/sdlc/core/store/useSdlcSessionStore.ts
import { create } from 'zustand';
import { SdlcSession, SdlcSessionStatus } from '@/shared/services/sdlc-session';
import { LlmProvider } from '@/shared/services/llm-chat';

export interface SdlcSessionStoreState {
    sessions: Record<string, SdlcSession>;
    activeSessionId: string | null;

    // Actions
    createSession: () => string;
    setActiveSession: (sessionId: string) => void;
    deleteSession: (sessionId: string) => void;
    updateActiveSession: (updater: (draft: SdlcSession) => void) => void;
    setAllSessions: (sessions: SdlcSession[]) => void;
}

const createDefaultSession = (id: string): SdlcSession => ({
    sessionId: id,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'draft',
    activeStepId: 'CODEBASE_CONTEXT',
    contextPointers: {
        selectedEntityId: null,
        impactedNodeIds: [],
        callersDepth: 1,
        calleesDepth: 1,
    },
    instructionsPayload: {
        strategy: 'vibe',
        promptText: '',
    },
    llmChat: {
        provider: LlmProvider.OLLAMA,
        selectedModel: '',
        temperature: 0.2,
        messages: [],
    }
});

export const useSdlcSessionStore = create<SdlcSessionStoreState>((set) => ({
    sessions: {},
    activeSessionId: null,

    createSession: () => {
        const newId = `session-${Date.now()}`;
        set((state) => ({
            sessions: { ...state.sessions, [newId]: createDefaultSession(newId) },
            activeSessionId: newId,
        }));
        return newId;
    },

    setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

    deleteSession: (sessionId) => set((state) => {
        const newSessions = { ...state.sessions };
        delete newSessions[sessionId];
        return {
            sessions: newSessions,
            activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId
        };
    }),

    updateActiveSession: (updater) => set((state) => {
        if (!state.activeSessionId) return state;
        const session = state.sessions[state.activeSessionId];
        if (!session) return state;

        // Shallow clone for immutability without full deep copy overhead
        const draft = JSON.parse(JSON.stringify(session)) as SdlcSession;
        updater(draft);
        draft.updatedAt = Date.now();

        return {
            sessions: { ...state.sessions, [state.activeSessionId]: draft }
        };
    }),

    setAllSessions: (sessionsList) => set(() => {
        const map: Record<string, SdlcSession> = {};
        sessionsList.forEach(s => { map[s.sessionId] = s; });
        return { sessions: map };
    })
}));
EOF

cat << 'EOF' > webview/src/features/sdlc/core/store/useCodebaseCache.ts
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
EOF

cat << 'EOF' > webview/src/features/sdlc/core/store/useGlobalConfigStore.ts
import { create } from 'zustand';

export interface AnonymizationRule {
    id: string;
    name: string;
    pattern: string;
    replacement: string;
    inversePattern: string;
    enabled: boolean;
}

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

export const DEFAULT_ANONYMIZATION_RULES: AnonymizationRule[] = [
    {
        id: 'rule-secrets',
        name: 'Secret & Password Tokens',
        pattern: '(?i)(password|secret|key|token)\\s*[:=]\\s*[\'"][^\'"]+[\'"]',
        replacement: '$1: "ANONYMIZED_SECRET"',
        inversePattern: 'ANONYMIZED_SECRET',
        enabled: true,
    }
];

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

export interface GlobalConfigState {
    globalConfig: GraphRagExplorerConfig;
    anonymizationRules: AnonymizationRule[];

    updateGlobalConfig: (partial: Partial<GraphRagExplorerConfig>) => void;
    updateAnonymizationRules: (rules: AnonymizationRule[]) => void;
}

export const useGlobalConfigStore = create<GlobalConfigState>((set) => ({
    globalConfig: INITIAL_CONFIG,
    anonymizationRules: DEFAULT_ANONYMIZATION_RULES,

    updateGlobalConfig: (partial) => set((state) => ({
        globalConfig: { ...state.globalConfig, ...partial }
    })),

    updateAnonymizationRules: (rules) => set({ anonymizationRules: rules })
}));
EOF

cat << 'EOF' > webview/src/features/sdlc/core/workflow/useSdlcWorkflowMachine.ts
import { create } from 'zustand';

export type SdlcStep =
    | 'CODEBASE_CONTEXT'
    | 'INSTRUCTIONS'
    | 'LLM_CHAT'
    | 'RESULTS_MANAGER'
    | 'CONFIGURATION';

export interface SdlcWorkflowMachineState {
    currentStep: SdlcStep;
    transitionTo: (step: SdlcStep) => void;
}

/**
 * Headless state machine controlling the active view.
 * SdlcLayoutOrchestrator listens to this to map domains to UI containers.
 */
export const useSdlcWorkflowMachine = create<SdlcWorkflowMachineState>((set) => ({
    currentStep: 'CODEBASE_CONTEXT',
    transitionTo: (step) => set({ currentStep: step })
}));
EOF

cat << 'EOF' > webview/src/features/sdlc/core/vscode-sync/session-persistence.manager.ts
import { useSdlcSessionStore } from '../store/useSdlcSessionStore';
// @ts-ignore - Will be generated via npm run generate:code
import { sdlcSessionApiService } from '@/services/api/sdlc-session-api.service.gen';
import { logInfo, logError } from '@/services/view/log-view.service.wrapper';

let saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Subscribes to the SdlcSessionStore and syncs the active session to disk via RPC.
 */
export function initSessionPersistence() {
    // 1. Initial Load
    sdlcSessionApiService.loadAllSessions()
        .then((sessions) => {
            useSdlcSessionStore.getState().setAllSessions(sessions);
            if (sessions.length > 0 && !useSdlcSessionStore.getState().activeSessionId) {
                // Auto-load most recent session
                useSdlcSessionStore.getState().setActiveSession(sessions[0].sessionId);
            } else if (sessions.length === 0) {
                useSdlcSessionStore.getState().createSession();
            }
        })
        .catch(err => logError('Failed to load initial SDLC sessions', err));

    // 2. Debounced Save Subscription
    useSdlcSessionStore.subscribe((state) => {
        if (!state.activeSessionId) return;
        const activeSession = state.sessions[state.activeSessionId];
        if (!activeSession) return;

        if (saveDebounceTimer) clearTimeout(saveDebounceTimer);

        saveDebounceTimer = setTimeout(() => {
            queueMicrotask(() => {
                sdlcSessionApiService.saveSession(activeSession)
                    .then(() => logInfo(`Session ${activeSession.sessionId} synced to disk.`))
                    .catch((err) => logError(`Failed to sync session to disk`, err));
            });
        }, 1000);
    });
}
EOF

# ------------------------------------------------------------------------------
# AUTOMATED RPC & API GENERATION
# ------------------------------------------------------------------------------

echo "🔨 Triggering dev-tools generators to wire up the new RPC Interfaces..."
# This executes the existing node.js scripts to generate ServiceEnum, RpcMethodEnum,
# service-registrator, rpc-registrator, and webview-api-services.
npm run generate:code

echo ""
echo "✅ feat: Generated SDLC Core Foundation (Zustand Stores, Workflow Machine, RPC Interfaces, Backend Adapters)."
echo "   - Created ISdlcSessionServicePort and SdlcSessionAdapter."
echo "   - Generated useSdlcSessionStore (Lightweight) & useCodebaseCache (Heavy)."
echo "   - Ran dev-tools generators to expose sdlcSessionApiService to the Webview."
echo "▶️  NEXT STEP: Awaiting 'Proceed' to generate Batch 2 (UI Common Perimeter & CodebaseContext Domain)."

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

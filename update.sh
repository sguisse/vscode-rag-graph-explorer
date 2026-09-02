#!/usr/bin/env bash
set -e

echo "🚀 Fixing session state transmission between Instructions and LLM Chat Prompt Panel..."

# Ensure target directories exist
mkdir -p shared/services/sdlc-session/model
mkdir -p webview/src/features/sdlc/core/store
mkdir -p webview/src/features/sdlc/domains/instructions/components
mkdir -p webview/src/features/sdlc/domains/llm-chat/components
mkdir -p webview/src/features/sdlc/domains/llm-chat/layout-ctns

# 1. Update shared SdlcSession model definition
cat << 'EOF' > shared/services/sdlc-session/model/sdlc-session.model.ts
import { IChatMessageDto, LlmProvider } from '../../llm-chat';
import { ReferenceItem } from '../../reference/model/reference-model';

export type SdlcSessionStatus = 'draft' | 'running' | 'error' | 'success';

export interface CodebaseContextPointers {
    selectedEntityId: string | null;
    impactedNodeIds: string[];
    callersDepth: number;
    calleesDepth: number;
    /** Selected codebase file context paths */
    selectedFiles?: string[];
}

export interface InstructionsPayload {
    selectedAgent?: string;
    strategy: 'vibe' | 'vibe-coding' | 'bmad' | 'speckit' | 'gsd';
    promptText: string;
    /** Selected reference items from instructions */
    selectedReferences?: ReferenceItem[];
}

export interface LlmChatPayload {
    provider: LlmProvider;
    selectedModel: string;
    temperature: number;
    messages: IChatMessageDto[];
    /** Refined prompt text edited inside the LLM chat panel */
    customPrompt?: string;
    /** Adjusted reference items selected for the LLM request (undefined inherits from Instructions) */
    selectedReferences?: ReferenceItem[];
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

# 2. Update useSdlcSessionStore with clean initial session defaults and diagnostic logging
cat << 'EOF' > webview/src/features/sdlc/core/store/useSdlcSessionStore.ts
import { create } from 'zustand';
import { SdlcSession } from '@/shared/services/sdlc-session/model/sdlc-session.model';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

const logStore = (action: string, details?: any) => {
  console.log(`[SdlcSessionStore] 🔄 ${action}`, details ?? '');
};

export interface SdlcSessionState {
  activeSessionId: string | null;
  sessions: Record<string, SdlcSession>;

  // Core Session Management
  setActiveSessionId: (id: string | null) => void;
  setActiveSession: (id: string | null) => void;
  setAllSessions: (sessions: SdlcSession[] | Record<string, SdlcSession>) => void;
  updateActiveSession: (updater: (draft: SdlcSession) => void) => void;
  createSession: (sessionId?: string) => string;
  deleteSession: (sessionId: string) => void;

  // Selected File Context Management
  setSelectedFiles: (files: string[]) => void;
  addSelectedFile: (filePath: string) => void;
  removeSelectedFile: (filePath: string) => void;

  // Structured Prompt Management
  setPromptText: (promptText: string) => void;

  // Selected Reference Items Management
  setSelectedReferences: (references: ReferenceItem[]) => void;
  toggleReferenceSelection: (reference: ReferenceItem) => void;
  isReferenceSelected: (referenceId: string) => boolean;
}

const createInitialSession = (id: string): SdlcSession => ({
  sessionId: id,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  status: 'draft',
  activeStepId: 'step-instructions',
  contextPointers: {
    selectedEntityId: null,
    impactedNodeIds: [],
    callersDepth: 1,
    calleesDepth: 1,
    selectedFiles: [],
  },
  instructionsPayload: {
    strategy: 'bmad',
    promptText: '',
    selectedReferences: undefined,
  },
  llmChat: {
    provider: 'gemini' as any,
    selectedModel: 'gemini-2.5-pro',
    temperature: 0.2,
    messages: [],
    customPrompt: undefined,
    selectedReferences: undefined,
  },
});

const defaultSessionId = 'session-default';
const initialDefaultSession = createInitialSession(defaultSessionId);

export const useSdlcSessionStore = create<SdlcSessionState>((set, get) => ({
  activeSessionId: defaultSessionId,
  sessions: { [defaultSessionId]: initialDefaultSession },

  setActiveSessionId: (id) => {
    logStore('setActiveSessionId', { id });
    set({ activeSessionId: id });
  },

  setActiveSession: (id) => {
    logStore('setActiveSession', { id });
    set({ activeSessionId: id });
  },

  setAllSessions: (sessionsInput) => {
    logStore('setAllSessions', { input: sessionsInput });
    let map: Record<string, SdlcSession> = {};
    if (Array.isArray(sessionsInput)) {
      sessionsInput.forEach((s) => {
        map[s.sessionId] = s;
      });
    } else {
      map = sessionsInput || {};
    }
    const keys = Object.keys(map);
    const currentActive = get().activeSessionId;
    const candidateActive = (currentActive && map[currentActive] ? currentActive : keys[0]) || defaultSessionId;
    const nextActive: string = candidateActive || defaultSessionId;

    if (!map[nextActive]) {
      map[nextActive] = createInitialSession(nextActive);
    }

    set({ sessions: map, activeSessionId: nextActive });
  },

  updateActiveSession: (updater) => {
    let { activeSessionId, sessions } = get();

    if (!activeSessionId || !sessions[activeSessionId]) {
      const keys = Object.keys(sessions);
      if (keys.length > 0) {
        activeSessionId = keys[0];
      } else {
        activeSessionId = defaultSessionId;
        sessions = { [defaultSessionId]: createInitialSession(defaultSessionId) };
      }
    }

    const currentSession = sessions[activeSessionId];
    const sessionCopy: SdlcSession = {
      ...currentSession,
      contextPointers: { ...currentSession.contextPointers },
      instructionsPayload: { ...currentSession.instructionsPayload },
      llmChat: { ...currentSession.llmChat },
      updatedAt: Date.now(),
    };

    updater(sessionCopy);

    logStore('updateActiveSession SUCCESS', {
      activeSessionId,
      promptTextLength: sessionCopy.instructionsPayload?.promptText?.length,
      customPromptLength: sessionCopy.llmChat?.customPrompt?.length,
      instructionsRefsCount: sessionCopy.instructionsPayload?.selectedReferences?.length,
      llmChatRefsCount: sessionCopy.llmChat?.selectedReferences?.length,
      selectedFilesCount: sessionCopy.contextPointers?.selectedFiles?.length,
    });

    set({
      activeSessionId,
      sessions: {
        ...sessions,
        [activeSessionId]: sessionCopy,
      },
    });
  },

  createSession: (customId) => {
    const id = customId || `session-${Date.now()}`;
    logStore('createSession', { id });
    const newSession = createInitialSession(id);
    set((state) => ({
      sessions: { ...state.sessions, [id]: newSession },
      activeSessionId: id,
    }));
    return id;
  },

  deleteSession: (sessionId) => {
    logStore('deleteSession', { sessionId });
    set((state) => {
      const { [sessionId]: _, ...remainingSessions } = state.sessions;
      const candidateId =
        state.activeSessionId === sessionId
          ? Object.keys(remainingSessions)[0]
          : state.activeSessionId;
      const nextActiveId: string = candidateId || defaultSessionId;

      if (!remainingSessions[nextActiveId]) {
        remainingSessions[nextActiveId] = createInitialSession(nextActiveId);
      }

      return {
        sessions: remainingSessions,
        activeSessionId: nextActiveId,
      };
    });
  },

  setSelectedFiles: (files) => {
    logStore('setSelectedFiles', { files });
    get().updateActiveSession((draft) => {
      if (!draft.contextPointers) {
        draft.contextPointers = {
          selectedEntityId: null,
          impactedNodeIds: [],
          callersDepth: 1,
          calleesDepth: 1,
          selectedFiles: [],
        };
      }
      draft.contextPointers.selectedFiles = files;
    });
  },

  addSelectedFile: (filePath) => {
    logStore('addSelectedFile', { filePath });
    get().updateActiveSession((draft) => {
      if (!draft.contextPointers.selectedFiles) {
        draft.contextPointers.selectedFiles = [];
      }
      if (!draft.contextPointers.selectedFiles.includes(filePath)) {
        draft.contextPointers.selectedFiles.push(filePath);
      }
    });
  },

  removeSelectedFile: (filePath) => {
    logStore('removeSelectedFile', { filePath });
    get().updateActiveSession((draft) => {
      if (draft.contextPointers?.selectedFiles) {
        draft.contextPointers.selectedFiles = draft.contextPointers.selectedFiles.filter(
          (f) => f !== filePath
        );
      }
    });
  },

  setPromptText: (promptText) => {
    logStore('setPromptText', { length: promptText?.length });
    get().updateActiveSession((draft) => {
      if (!draft.instructionsPayload) {
        draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      }
      draft.instructionsPayload.promptText = promptText;
      if (draft.llmChat) {
        draft.llmChat.customPrompt = undefined;
      }
    });
  },

  setSelectedReferences: (references) => {
    logStore('setSelectedReferences', { count: references?.length });
    get().updateActiveSession((draft) => {
      if (!draft.instructionsPayload) {
        draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      }
      draft.instructionsPayload.selectedReferences = references;
    });
  },

  toggleReferenceSelection: (reference) => {
    logStore('toggleReferenceSelection', { referenceId: reference.id });
    get().updateActiveSession((draft) => {
      const currentRefs =
        draft.llmChat?.selectedReferences ?? draft.instructionsPayload?.selectedReferences ?? [];
      const exists = currentRefs.some((r) => r.id === reference.id);

      const updatedRefs = exists
        ? currentRefs.filter((r) => r.id !== reference.id)
        : [...currentRefs, reference];

      if (!draft.instructionsPayload) draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
      draft.instructionsPayload.selectedReferences = updatedRefs;

      if (!draft.llmChat) {
        draft.llmChat = {
          provider: 'gemini' as any,
          selectedModel: 'gemini-2.5-pro',
          temperature: 0.2,
          messages: [],
        };
      }
      draft.llmChat.selectedReferences = updatedRefs;
    });
  },

  isReferenceSelected: (referenceId) => {
    const { activeSessionId, sessions } = get();
    if (!activeSessionId || !sessions[activeSessionId]) return false;
    const session = sessions[activeSessionId];
    const refs = session.llmChat?.selectedReferences ?? session.instructionsPayload?.selectedReferences ?? [];
    return refs.some((r) => r.id === referenceId);
  },
}));
EOF

# 3. Update InstructionsPanel to sync references to session store when mounted/updated
cat << 'EOF' > webview/src/features/sdlc/domains/instructions/components/InstructionsPanel.tsx
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Bot, FileText } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { SkillsByCategoryConfig, Skill } from '../model/skills';
import { INSTRUCTION_METHODS, InstructionMethodId } from '../types';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { ProjectReferencesPanel } from '@/components/app/project-references';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import { REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';

function formatPromptText(text: string): string {
  if (!text) return '';
  let formatted = text.replace(/\\n/g, '\n');
  formatted = formatted
    .replace(/(BUSINESS CONTEXT:)/g, '\n$1')
    .replace(/(EXPECTED ACTION:)/g, '\n\n$1')
    .replace(/(OUTPUT FORMAT:)/g, '\n\n$1')
    .trim();
  return formatted;
}

export function InstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  const strategy = (session?.instructionsPayload?.strategy as InstructionMethodId) || 'bmad';
  const methodConfig = INSTRUCTION_METHODS[strategy] || INSTRUCTION_METHODS['bmad'];
  const categories: SkillsByCategoryConfig = methodConfig.data;

  const [autoCopySample, setAutoCopySample] = useState<boolean>(true);
  const [selectedDomain, setSelectedDomain] = useState<string>('');
  const [selectedSubDomain, setSelectedSubDomain] = useState<string>('');

  const selectedCommand = (session?.instructionsPayload as any)?.selectedAgent || '';

  // Auto-sync project references into instructionsPayload.selectedReferences
  useEffect(() => {
    let isMounted = true;
    const syncReferences = async () => {
      try {
        if (referenceApiService?.loadAllReferences) {
          const refs = await referenceApiService.loadAllReferences(REFERENCES_PROJECT_KEY);
          if (isMounted && refs) {
            const preSelectedRefs = refs.filter((r) => Boolean(r.preSelected));
            console.log('[InstructionsPanel] 🔄 Syncing preSelected references to session store:', preSelectedRefs.map((r) => r.name));
            updateSession((draft) => {
              if (!draft.instructionsPayload) {
                draft.instructionsPayload = { strategy, promptText: '' };
              }
              draft.instructionsPayload.selectedReferences = preSelectedRefs;
            });
          }
        }
      } catch (err) {
        console.error('[InstructionsPanel] Error syncing references:', err);
      }
    };
    syncReferences();

    return () => {
      isMounted = false;
    };
  }, [updateSession, strategy]);

  const selectedSkill = useMemo<Skill | null>(() => {
    if (!selectedCommand) return null;
    for (const cat of categories) {
      for (const skill of cat.skills) {
        if (skill.command === selectedCommand) return skill;
      }
    }
    return null;
  }, [categories, selectedCommand]);

  const domainMap = useMemo(() => {
    const map: Record<string, Record<string, string>> = {};

    const sourceSkills =
      selectedSkill?.prompts && selectedSkill.prompts.length > 0
        ? [selectedSkill]
        : categories.flatMap((cat) => cat.skills);

    sourceSkills.forEach((skill) => {
      if (!skill.prompts) return;
      skill.prompts.forEach((domainObj) => {
        Object.entries(domainObj).forEach(([domainName, promptMap]) => {
          if (!map[domainName]) {
            map[domainName] = {};
          }
          if (promptMap && typeof promptMap === 'object') {
            Object.entries(promptMap).forEach(([subDomain, rawPrompt]) => {
              map[domainName][subDomain] = formatPromptText(rawPrompt);
            });
          }
        });
      });
    });

    return map;
  }, [categories, selectedSkill]);

  const domains = useMemo(() => Object.keys(domainMap), [domainMap]);

  const subDomains = useMemo(() => {
    if (!selectedDomain || !domainMap[selectedDomain]) return [];
    return Object.keys(domainMap[selectedDomain]);
  }, [domainMap, selectedDomain]);

  const applyPromptToTextarea = useCallback(
    (promptText: string) => {
      if (!promptText) return;
      console.log('[InstructionsPanel] 📝 Applying prompt text to instructionsPayload:', promptText.substring(0, 40));
      updateSession((draft) => {
        if (!draft.instructionsPayload) {
          draft.instructionsPayload = { strategy, promptText: '' };
        }
        draft.instructionsPayload.promptText = promptText;
        if (draft.llmChat) {
          draft.llmChat.customPrompt = undefined;
        }
      });
    },
    [strategy, updateSession]
  );

  useEffect(() => {
    if (domains.length === 0) return;

    let targetDomain = selectedDomain;
    if (!targetDomain || !domainMap[targetDomain]) {
      targetDomain = domains[0];
      setSelectedDomain(targetDomain);
    }

    const availSubDomains = domainMap[targetDomain] ? Object.keys(domainMap[targetDomain]) : [];
    let targetSubDomain = selectedSubDomain;
    if (!targetSubDomain || !availSubDomains.includes(targetSubDomain)) {
      targetSubDomain = availSubDomains[0] || '';
      setSelectedSubDomain(targetSubDomain);
    }

    if (autoCopySample && targetDomain && targetSubDomain && domainMap[targetDomain]?.[targetSubDomain]) {
      const sampleText = domainMap[targetDomain][targetSubDomain];
      applyPromptToTextarea(sampleText);
    }
  }, [domains, domainMap]);

  if (!session) return null;

  const promptText = session.instructionsPayload?.promptText || '';
  const promptCharCount = promptText.length;

  const handleCheckboxChange = (checked: boolean) => {
    setAutoCopySample(checked);
    if (checked && selectedDomain && selectedSubDomain && domainMap[selectedDomain]?.[selectedSubDomain]) {
      applyPromptToTextarea(domainMap[selectedDomain][selectedSubDomain]);
    }
  };

  const handleDomainSelect = (val: string | null) => {
    if (!val) return;
    setSelectedDomain(val);
    const availableSubs = domainMap[val] ? Object.keys(domainMap[val]) : [];
    const firstSub = availableSubs[0] || '';
    setSelectedSubDomain(firstSub);

    if (autoCopySample && val && firstSub && domainMap[val]?.[firstSub]) {
      applyPromptToTextarea(domainMap[val][firstSub]);
    }
  };

  const handleSubDomainSelect = (subDomain: string | null) => {
    if (!subDomain) return;
    setSelectedSubDomain(subDomain);
    if (autoCopySample && selectedDomain && subDomain && domainMap[selectedDomain]?.[subDomain]) {
      applyPromptToTextarea(domainMap[selectedDomain][subDomain]);
    }
  };

  return (
    <TopMiddleBottomPanel
      id="instructions-panel"
      className="gap-3 p-2 h-full"
      top={
        <div className="space-y-2">
          <div className={`${methodConfig.bgBannerColor} p-3 border rounded-lg`}>
            <h4 className="font-bold text-foreground text-sm uppercase">
              {methodConfig.emoji} {methodConfig.title}
            </h4>
            <p className="mt-1 text-[10px] text-muted-foreground">{methodConfig.description}</p>
          </div>

          <div className="space-y-2 bg-card p-2.5 border border-border rounded-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[10px] text-foreground uppercase">
                  <Bot size={12} className={`inline mr-1 ${methodConfig.color}`} /> Domain & Subdomain Prompt Selection
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-1.5 font-medium text-[10px] text-muted-foreground hover:text-foreground cursor-pointer select-none shrink-0">
                <input
                  type="checkbox"
                  checked={autoCopySample}
                  onChange={(e) => handleCheckboxChange(e.target.checked)}
                  className={`bg-background border-border rounded w-3.5 h-3.5 cursor-pointer ${methodConfig.accentColor}`}
                />
                <span>Auto-copy</span>
              </label>

              <Select value={selectedDomain} onValueChange={handleDomainSelect}>
                <SelectTrigger className="bg-background w-1/2 h-8 text-xs">
                  <SelectValue placeholder="Select Domain..." />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((domain) => (
                    <SelectItem key={domain} value={domain}>
                      {domain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={selectedSubDomain}
                onValueChange={handleSubDomainSelect}
                disabled={!selectedDomain || subDomains.length === 0}
              >
                <SelectTrigger className="bg-background w-1/2 h-8 text-xs">
                  <SelectValue placeholder="Select Subdomain..." />
                </SelectTrigger>
                <SelectContent>
                  {subDomains.map((subDomain) => (
                    <SelectItem key={subDomain} value={subDomain}>
                      {subDomain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      }
      middle={
        <CollapsibleCard
          title={
            <div className="flex items-center gap-1.5">
              <FileText size={13} className={methodConfig.color} />
              <span className="font-bold text-xs uppercase">Structured Prompt</span>
            </div>
          }
          badge={`${promptCharCount} Chars`}
          defaultExpanded={true}
          contentToCopy={promptText}
          className="flex flex-col bg-card border-border h-full min-h-0"
        >
          <div className="flex flex-col p-2 space-y-1 h-full min-h-[160px]">
            <Textarea
              value={promptText}
              onChange={(e) => {
                const newVal = e.target.value;
                console.log('[InstructionsPanel] ✏️ User edited prompt:', newVal.substring(0, 40));
                updateSession((draft) => {
                  if (!draft.instructionsPayload) draft.instructionsPayload = { strategy, promptText: '' };
                  draft.instructionsPayload.promptText = newVal;
                  if (draft.llmChat) {
                    draft.llmChat.customPrompt = undefined;
                  }
                });
              }}
              placeholder="[CONTEXT]\n...\n[EXPECTED]\n...\n[OUTPUT FORMAT]\n..."
              className="flex-1 bg-background min-h-[160px] font-mono text-xs resize-y"
            />
          </div>
        </CollapsibleCard>
      }
      bottom={
        <ProjectReferencesPanel
          localDocumentStorage="global-project-references"
          viewMode="User"
          collapsibleParentIncluded={true}
        />
      }
    />
  );
}
EOF

# 4. Update LeftPanelContainer in LLM Chat to refetch references on mount
cat << 'EOF' > webview/src/features/sdlc/domains/llm-chat/layout-ctns/LeftPanelContainer.tsx
import React, { useEffect, useState } from 'react';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { LlmChatPromptPanel } from '../components/LlmChatPromptPanel';
import { ReferenceItem, REFERENCES_PROJECT_KEY } from '@/shared/services/reference/model/reference-model';
import { referenceApiService } from '@/services/api/reference-api.service.gen';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';

export const LeftPanelContainer: React.FC = () => {
  const [allReferences, setAllReferences] = useState<ReferenceItem[]>([]);
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  useEffect(() => {
    let isMounted = true;
    const fetchReferences = async () => {
      try {
        if (referenceApiService?.loadAllReferences) {
          const refs = await referenceApiService.loadAllReferences(REFERENCES_PROJECT_KEY);
          console.log('[LeftPanelContainer LLM Chat] 📥 Loaded references:', refs?.length, refs?.map((r) => `${r.name} (${r.preSelected})`));
          if (isMounted && refs) {
            setAllReferences(refs);

            // If session instructionsPayload.selectedReferences is uninitialized, seed it with preSelected items
            const preSelectedRefs = refs.filter((r) => Boolean(r.preSelected));
            updateSession((draft) => {
              if (!draft.instructionsPayload) {
                draft.instructionsPayload = { strategy: 'bmad', promptText: '' };
              }
              if (!draft.instructionsPayload.selectedReferences) {
                draft.instructionsPayload.selectedReferences = preSelectedRefs;
              }
            });
          }
        }
      } catch (err) {
        console.error('[LeftPanelContainer LLM Chat] Error loading references:', err);
      }
    };

    fetchReferences();

    return () => {
      isMounted = false;
    };
  }, [activeSessionId, updateSession]);

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Prompt Tuning & Reference Context" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-hidden p-1.5">
        <LlmChatPromptPanel allReferences={allReferences} />
      </div>
    </div>
  );
};

export default LeftPanelContainer;
EOF

# 5. Update LlmChatPromptPanel with active reactive resolution and diagnostic logging
cat << 'EOF' > webview/src/features/sdlc/domains/llm-chat/components/LlmChatPromptPanel.tsx
import React, { useState, useMemo, useRef } from 'react';
import {
  FileText,
  Sparkles,
  Send,
  RotateCcw,
  GripHorizontal,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useSdlcSessionStore } from '@/features/sdlc/core/store/useSdlcSessionStore';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';

export interface LlmChatPromptPanelProps {
  allReferences?: ReferenceItem[];
  onSendToLlm?: (prompt: string, selectedRefs: ReferenceItem[]) => void;
}

export function LlmChatPromptPanel({
  allReferences = [],
  onSendToLlm,
}: LlmChatPromptPanelProps) {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  console.log('[LlmChatPromptPanel] 🎨 Render state check:', {
    activeSessionId,
    hasSession: Boolean(session),
    instructionsPromptLength: session?.instructionsPayload?.promptText?.length,
    customPromptLength: session?.llmChat?.customPrompt?.length,
    instructionsRefsCount: session?.instructionsPayload?.selectedReferences?.length,
    llmChatRefsCount: session?.llmChat?.selectedReferences?.length,
    allReferencesCount: allReferences.length,
  });

  // Dynamic Prompt Resolution
  const promptText = useMemo(() => {
    if (session?.llmChat?.customPrompt !== undefined && session.llmChat.customPrompt !== '') {
      console.log('[LlmChatPromptPanel] 📌 Using customPrompt:', session.llmChat.customPrompt.length, 'chars');
      return session.llmChat.customPrompt;
    }
    const instPrompt = session?.instructionsPayload?.promptText || '';
    console.log('[LlmChatPromptPanel] 📌 Fallback to instructionsPayload.promptText:', instPrompt.length, 'chars');
    return instPrompt;
  }, [session?.llmChat?.customPrompt, session?.instructionsPayload?.promptText]);

  // Effective selected references from Instructions (or preSelected items from allReferences)
  const selectedReferencesFromInstruction = useMemo(() => {
    const fromPayload = session?.instructionsPayload?.selectedReferences;
    if (fromPayload && fromPayload.length > 0) {
      console.log('[LlmChatPromptPanel] 🔗 Using instructionsPayload.selectedReferences:', fromPayload.map((r) => r.name));
      return fromPayload;
    }
    const preSelected = allReferences.filter((r) => Boolean(r.preSelected));
    console.log('[LlmChatPromptPanel] 🔗 Fallback to allReferences.preSelected:', preSelected.map((r) => r.name));
    return preSelected;
  }, [session?.instructionsPayload?.selectedReferences, allReferences]);

  // Effective selected references for LLM Chat
  const selectedReferencesFromChat = useMemo(() => {
    const chatRefs = session?.llmChat?.selectedReferences;
    if (chatRefs !== undefined && chatRefs !== null) {
      console.log('[LlmChatPromptPanel] 🔗 Using llmChat.selectedReferences override:', chatRefs.map((r) => r.name));
      return chatRefs;
    }
    console.log('[LlmChatPromptPanel] 🔗 Inheriting selectedReferencesFromInstruction:', selectedReferencesFromInstruction.map((r) => r.name));
    return selectedReferencesFromInstruction;
  }, [session?.llmChat?.selectedReferences, selectedReferencesFromInstruction]);

  const selectedRefIds = useMemo(() => {
    return new Set(selectedReferencesFromChat.map((r) => r.id));
  }, [selectedReferencesFromChat]);

  const instructionRefIds = useMemo(() => {
    return new Set(selectedReferencesFromInstruction.map((r) => r.id));
  }, [selectedReferencesFromInstruction]);

  // Split Panel Resizer Dragging
  const [footerHeight, setFooterHeight] = useState<number>(180);
  const isDraggingRef = useRef(false);
  const startYRef = useRef(0);
  const startHeightRef = useRef(180);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = footerHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaY = startYRef.current - moveEvent.clientY;
      const newHeight = Math.max(80, Math.min(420, startHeightRef.current + deltaY));
      setFooterHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Order by:
  // 1. Selected files in Instruction & Chat
  // 2. Category badge
  // 3. Reference name
  const sortedReferences = useMemo(() => {
    const list = [...allReferences];

    return list.sort((a, b) => {
      const aIsSelected = selectedRefIds.has(a.id) || instructionRefIds.has(a.id);
      const bIsSelected = selectedRefIds.has(b.id) || instructionRefIds.has(b.id);

      if (aIsSelected !== bIsSelected) {
        return aIsSelected ? -1 : 1;
      }

      const catCompare = (a.category || '').localeCompare(b.category || '');
      if (catCompare !== 0) return catCompare;

      return (a.name || '').localeCompare(b.name || '');
    });
  }, [allReferences, selectedRefIds, instructionRefIds]);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    console.log('[LlmChatPromptPanel] ✏️ User editing customPrompt:', val.length, 'chars');
    updateSession((draft) => {
      if (!draft.llmChat) {
        draft.llmChat = {
          provider: 'gemini' as any,
          selectedModel: 'gemini-2.5-pro',
          temperature: 0.2,
          messages: [],
        };
      }
      draft.llmChat.customPrompt = val;
    });
  };

  const handleToggleReference = (item: ReferenceItem) => {
    console.log('[LlmChatPromptPanel] 🔘 Toggling reference item:', item.id, item.name);
    updateSession((draft) => {
      if (!draft.llmChat) {
        draft.llmChat = {
          provider: 'gemini' as any,
          selectedModel: 'gemini-2.5-pro',
          temperature: 0.2,
          messages: [],
        };
      }
      const current = draft.llmChat.selectedReferences ?? selectedReferencesFromInstruction;
      const exists = current.some((r) => r.id === item.id);

      const next = exists
        ? current.filter((r) => r.id !== item.id)
        : [...current, item];

      draft.llmChat.selectedReferences = next;
    });
  };

  const handleSelectAll = () => {
    console.log('[LlmChatPromptPanel] ✅ Selecting all references:', allReferences.length);
    updateSession((draft) => {
      if (!draft.llmChat) draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.selectedReferences = [...allReferences];
    });
  };

  const handleDeselectAll = () => {
    console.log('[LlmChatPromptPanel] ❌ Deselecting all references');
    updateSession((draft) => {
      if (!draft.llmChat) draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.selectedReferences = [];
    });
  };

  const handleResetFromInstructions = () => {
    console.log('[LlmChatPromptPanel] 🔄 Resetting custom prompt & references to Instructions defaults');
    updateSession((draft) => {
      if (!draft.llmChat) draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.customPrompt = undefined;
      draft.llmChat.selectedReferences = undefined;
    });
  };

  const handleSend = () => {
    console.log('[LlmChatPromptPanel] 🚀 Send to LLM triggered with prompt & references:', {
      promptLength: promptText.length,
      refsCount: selectedReferencesFromChat.length,
    });
    if (onSendToLlm) {
      onSendToLlm(promptText, selectedReferencesFromChat);
    }
  };

  return (
    <div className="flex flex-col bg-card border border-border rounded-lg w-full h-full min-h-0 overflow-hidden font-mono text-xs shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center px-3 py-1.5 bg-muted/30 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-amber-400" />
          <span className="font-bold text-foreground text-xs uppercase tracking-wide">
            Prompt & Context Tuning
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFromInstructions}
          className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground"
          data-tooltip="Reset prompt and reference selections from Instructions"
        >
          <RotateCcw size={11} className="mr-1" /> Reset
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Top Area: Prompt Textarea */}
        <div className="flex-1 flex flex-col p-2 min-h-0 space-y-1">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">Structured Prompt</span>
            <span>{promptText.length} chars</span>
          </div>
          <Textarea
            value={promptText}
            onChange={handlePromptChange}
            placeholder="Adjust your prompt instructions before sending to LLM..."
            className="flex-1 bg-background font-mono text-xs resize-none p-2 border-border focus-visible:ring-primary min-h-[120px]"
          />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="flex justify-center items-center h-2 bg-muted/50 hover:bg-primary/20 border-y border-border/60 cursor-row-resize transition-colors shrink-0 group"
          data-tooltip="Drag to resize Reference Files panel"
        >
          <GripHorizontal size={12} className="text-muted-foreground group-hover:text-primary" />
        </div>

        {/* Split Resizable Panel Footer */}
        <div
          style={{ height: `${footerHeight}px` }}
          className="flex flex-col bg-background/60 shrink-0 min-h-[80px] max-h-[420px] overflow-hidden"
        >
          {/* Footer Panel Header */}
          <div className="flex justify-between items-center px-2.5 py-1 bg-muted/20 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-1.5">
              <FileText size={12} className="text-primary" />
              <span className="font-bold text-[11px] text-foreground">
                Selected Reference Files ({selectedReferencesFromChat.length}/{allReferences.length})
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Select All
              </Button>
              <span className="text-muted-foreground/40">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Flat List of Reference Files */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-1 font-mono text-xs">
            {sortedReferences.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground text-[10px] italic">
                No reference files available.
              </div>
            ) : (
              sortedReferences.map((refItem) => {
                const isSelected = selectedRefIds.has(refItem.id);

                return (
                  <div
                    key={refItem.id}
                    onClick={() => handleToggleReference(refItem)}
                    className={`flex items-center gap-2 p-1.5 rounded-md border text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-primary/30 text-foreground font-medium'
                        : 'bg-card border-border/60 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                    }`}
                  >
                    {/* Category Badge */}
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-1.5 py-0 text-[9px] font-bold uppercase text-foreground shrink-0">
                      {refItem.category || 'General'}
                    </span>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleReference(refItem)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-background border-border rounded w-3.5 h-3.5 cursor-pointer accent-primary shrink-0"
                    />

                    {/* Reference Name */}
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                      <span className="shrink-0">{refItem.emoji || '📄'}</span>
                      <span className="truncate text-xs font-semibold text-foreground">
                        {refItem.name}
                      </span>
                    </div>

                    {refItem.sizeKb > 0 && (
                      <span className="text-[9px] text-muted-foreground shrink-0 bg-muted/40 px-1 rounded">
                        {refItem.sizeKb} KB
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {onSendToLlm && (
        <div className="flex justify-between items-center px-3 py-2 bg-muted/30 border-t border-border shrink-0">
          <div className="text-[10px] text-muted-foreground">
            {selectedReferencesFromChat.length} reference(s) attached
          </div>
          <Button size="sm" onClick={handleSend} className="h-7 px-3 text-xs gap-1.5 font-bold">
            <Send size={12} /> Send to LLM
          </Button>
        </div>
      )}
    </div>
  );
}
EOF

echo "✅ fix(sdlc): Fixed prompt & references synchronization across Instructions, Session Store, and LLM Chat Prompt Panel with diagnostic logging!"

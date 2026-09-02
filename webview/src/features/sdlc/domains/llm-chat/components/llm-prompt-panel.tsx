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

export interface LlmPromptPanelProps {
  allReferences?: ReferenceItem[];
  onSendToLlm?: (prompt: string, selectedRefs: ReferenceItem[]) => void;
}

export function LlmPromptPanel({
  allReferences = [],
  onSendToLlm,
}: LlmPromptPanelProps) {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => (activeSessionId ? s.sessions[activeSessionId] : null));
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  console.log('[LlmPromptPanel] 🎨 Render state check:', {
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
      console.log('[LlmPromptPanel] 📌 Using customPrompt:', session.llmChat.customPrompt.length, 'chars');
      return session.llmChat.customPrompt;
    }
    const instPrompt = session?.instructionsPayload?.promptText || '';
    console.log('[LlmPromptPanel] 📌 Fallback to instructionsPayload.promptText:', instPrompt.length, 'chars');
    return instPrompt;
  }, [session?.llmChat?.customPrompt, session?.instructionsPayload?.promptText]);

  // Effective selected references from Instructions (or preSelected items from allReferences)
  const selectedReferencesFromInstruction = useMemo(() => {
    const fromPayload = session?.instructionsPayload?.selectedReferences;
    if (fromPayload && fromPayload.length > 0) {
      console.log('[LlmPromptPanel] 🔗 Using instructionsPayload.selectedReferences:', fromPayload.map((r) => r.name));
      return fromPayload;
    }
    const preSelected = allReferences.filter((r) => Boolean(r.preSelected));
    console.log('[LlmPromptPanel] 🔗 Fallback to allReferences.preSelected:', preSelected.map((r) => r.name));
    return preSelected;
  }, [session?.instructionsPayload?.selectedReferences, allReferences]);

  // Effective selected references for LLM Chat
  const selectedReferencesFromChat = useMemo(() => {
    const chatRefs = session?.llmChat?.selectedReferences;
    if (chatRefs !== undefined && chatRefs !== null) {
      console.log('[LlmPromptPanel] 🔗 Using llmChat.selectedReferences override:', chatRefs.map((r) => r.name));
      return chatRefs;
    }
    console.log('[LlmPromptPanel] 🔗 Inheriting selectedReferencesFromInstruction:', selectedReferencesFromInstruction.map((r) => r.name));
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
    console.log('[LlmPromptPanel] ✏️ User editing customPrompt:', val.length, 'chars');
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
    console.log('[LlmPromptPanel] 🔘 Toggling reference item:', item.id, item.name);
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
    console.log('[LlmPromptPanel] ✅ Selecting all references:', allReferences.length);
    updateSession((draft) => {
      if (!draft.llmChat) draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.selectedReferences = [...allReferences];
    });
  };

  const handleDeselectAll = () => {
    console.log('[LlmPromptPanel] ❌ Deselecting all references');
    updateSession((draft) => {
      if (!draft.llmChat) draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.selectedReferences = [];
    });
  };

  const handleResetFromInstructions = () => {
    console.log('[LlmPromptPanel] 🔄 Resetting custom prompt & references to Instructions defaults');
    updateSession((draft) => {
      if (!draft.llmChat) draft.llmChat = { provider: 'gemini' as any, selectedModel: 'gemini-2.5-pro', temperature: 0.2, messages: [] };
      draft.llmChat.customPrompt = undefined;
      draft.llmChat.selectedReferences = undefined;
    });
  };

  const handleSend = () => {
    console.log('[LlmPromptPanel] 🚀 Send to LLM triggered with prompt & references:', {
      promptLength: promptText.length,
      refsCount: selectedReferencesFromChat.length,
    });
    if (onSendToLlm) {
      onSendToLlm(promptText, selectedReferencesFromChat);
    }
  };

  return (
    <div className="flex flex-col bg-card shadow-sm border border-border rounded-lg w-full h-full min-h-0 overflow-hidden font-mono text-xs">
      {/* Header */}
      <div className="flex justify-between items-center bg-muted/30 px-3 py-1.5 border-border border-b shrink-0">
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
          className="px-2 h-6 text-[10px] text-muted-foreground hover:text-foreground"
          data-tooltip="Reset prompt and reference selections from Instructions"
        >
          <RotateCcw size={11} className="mr-1" /> Reset
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Top Area: Prompt Textarea */}
        <div className="flex flex-col flex-1 space-y-1 p-2 min-h-0">
          <div className="flex justify-between items-center text-[10px] text-muted-foreground">
            <span className="font-semibold text-foreground">Structured Prompt</span>
            <span>{promptText.length} chars</span>
          </div>
          <Textarea
            value={promptText}
            onChange={handlePromptChange}
            placeholder="Adjust your prompt instructions before sending to LLM..."
            className="flex-1 bg-background p-2 border-border focus-visible:ring-primary min-h-[120px] font-mono text-xs resize-none"
          />
        </div>

        {/* Resizable Divider */}
        <div
          onMouseDown={handleMouseDown}
          className="group flex justify-center items-center bg-muted/50 hover:bg-primary/20 border-border/60 border-y h-2 transition-colors cursor-row-resize shrink-0"
          data-tooltip="Drag to resize Reference Files panel"
        >
          <GripHorizontal size={12} className="text-muted-foreground group-hover:text-primary" />
        </div>

        {/* Split Resizable Panel Footer */}
        <div
          style={{ height: `${footerHeight}px` }}
          className="flex flex-col bg-background/60 min-h-[80px] max-h-[420px] overflow-hidden shrink-0"
        >
          {/* Footer Panel Header */}
          <div className="flex justify-between items-center bg-muted/20 px-2.5 py-1 border-border/50 border-b shrink-0">
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
                className="px-1.5 h-5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Select All
              </Button>
              <span className="text-muted-foreground/40">|</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                className="px-1.5 h-5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                Deselect All
              </Button>
            </div>
          </div>

          {/* Flat List of Reference Files */}
          <div className="flex-1 space-y-1 p-1.5 overflow-y-auto font-mono text-xs">
            {sortedReferences.length === 0 ? (
              <div className="flex justify-center items-center h-full text-[10px] text-muted-foreground italic">
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
                    <span className="inline-flex items-center bg-muted/60 px-1.5 py-0 border border-border rounded-md font-bold text-[9px] text-foreground uppercase shrink-0">
                      {refItem.category || 'General'}
                    </span>

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleReference(refItem)}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-background border-border rounded w-3.5 h-3.5 accent-primary cursor-pointer shrink-0"
                    />

                    {/* Reference Name */}
                    <div className="flex flex-1 items-center gap-1.5 min-w-0 truncate">
                      <span className="shrink-0">{refItem.emoji || '📄'}</span>
                      <span className="font-semibold text-foreground text-xs truncate">
                        {refItem.name}
                      </span>
                    </div>

                    {refItem.sizeKb > 0 && (
                      <span className="bg-muted/40 px-1 rounded text-[9px] text-muted-foreground shrink-0">
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
        <div className="flex justify-between items-center bg-muted/30 px-3 py-2 border-border border-t shrink-0">
          <div className="text-[10px] text-muted-foreground">
            {selectedReferencesFromChat.length} reference(s) attached
          </div>
          <Button size="sm" onClick={handleSend} className="gap-1.5 px-3 h-7 font-bold text-xs">
            <Send size={12} /> Send to LLM
          </Button>
        </div>
      )}
    </div>
  );
}

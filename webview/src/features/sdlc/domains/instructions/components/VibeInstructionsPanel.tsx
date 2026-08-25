import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useSdlcSessionStore } from '../../../core/store/useSdlcSessionStore';

export function VibeInstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in">
      <div className="bg-primary/5 p-3 border border-primary/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">Vibe Coding</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Rapid, unstructured prompting. Just tell the LLM what you want to achieve with the selected codebase context.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Instruction Prompt:</label>
        <Textarea
          value={session.instructionsPayload.promptText}
          onChange={(e) => updateSession(draft => { draft.instructionsPayload.promptText = e.target.value; })}
          placeholder="Describe what you want to build or refactor..."
          className="bg-background min-h-[300px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}

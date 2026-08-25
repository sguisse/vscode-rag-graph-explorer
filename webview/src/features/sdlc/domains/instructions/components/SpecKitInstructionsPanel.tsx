import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { useSdlcSessionStore } from '../../../core/store/useSdlcSessionStore';

export function SpecKitInstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in">
      <div className="bg-emerald-500/5 p-3 border border-emerald-500/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">SpecKit Driven Dev</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Generate code strictly conforming to functional specifications and test criteria.
        </p>
      </div>

      <div className="space-y-1.5">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Specification Requirements:</label>
        <Textarea
          value={session.instructionsPayload.promptText}
          onChange={(e) => updateSession(draft => { draft.instructionsPayload.promptText = e.target.value; })}
          placeholder="Paste your Gherkin syntax or Markdown specs here..."
          className="bg-background min-h-[300px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}

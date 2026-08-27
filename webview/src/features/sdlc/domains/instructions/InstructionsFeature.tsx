import React from 'react';
import { Button } from '@/components/ui/button';
import { VibeInstructionsPanel } from './components/VibeInstructionsPanel';
import { BMadInstructionsPanel } from './components/BMadInstructionsPanel';
import { SpecKitInstructionsPanel } from './components/SpecKitInstructionsPanel';
import { useSdlcSessionStore } from '../../core/store/useSdlcSessionStore';

export function InstructionsFeature() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) {
    return <div className="p-4 font-mono text-muted-foreground text-xs text-center">No active session selected.</div>;
  }

  const strategy = session.instructionsPayload.strategy;

  const setStrategy = (strat: 'vibe' | 'bmad' | 'speckit') => {
    updateSession((draft) => { draft.instructionsPayload.strategy = strat; });
  };

  return (
    <div className="flex flex-col bg-card w-full h-full min-h-0 overflow-hidden font-mono text-xs">
      <div className="flex bg-muted/40 border-border border-b h-9 shrink-0">
        <Button
          variant="ghost"
          onClick={() => setStrategy('vibe')}
          className={`flex-1 h-9 rounded-none border-b-2 text-xs font-bold ${
            strategy === 'vibe' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Vibe Coding
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStrategy('bmad')}
          className={`flex-1 h-9 rounded-none border-b-2 text-xs font-bold ${
            strategy === 'bmad' ? 'border-b-indigo-500 text-indigo-500 bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          BMad Method
        </Button>
        <Button
          variant="ghost"
          onClick={() => setStrategy('speckit')}
          className={`flex-1 h-9 rounded-none border-b-2 text-xs font-bold ${
            strategy === 'speckit' ? 'border-b-emerald-500 text-emerald-500 bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          SpecKit
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {strategy === 'vibe' && <VibeInstructionsPanel />}
        {strategy === 'bmad' && <BMadInstructionsPanel />}
        {strategy === 'speckit' && <SpecKitInstructionsPanel />}
      </div>
    </div>
  );
}

import React from 'react';
import { Bot } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useSdlcSessionStore } from '../../../core/store/useSdlcSessionStore';

const AGENTS_LIST = ['CodeRefactoringAgent', 'SecurityAuditAgent', 'ASTGraphAgent', 'TestGeneratorAgent'];

export function BMadInstructionsPanel() {
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const session = useSdlcSessionStore((s) => activeSessionId ? s.sessions[activeSessionId] : null);
  const updateSession = useSdlcSessionStore((s) => s.updateActiveSession);

  if (!session) return null;

  const handleAgentSelect = (val: string | null) => {
    if (!val) return;
    updateSession(draft => {
      draft.instructionsPayload.promptText = `[AGENT]: ${val}\n${draft.instructionsPayload.promptText}`;
    });
  };

  return (
    <div className="space-y-3 p-3 font-mono text-xs animate-in fade-in h-full overflow-y-auto">
      <div className="bg-indigo-500/5 p-3 border border-indigo-500/20 rounded-lg">
        <h4 className="font-bold text-foreground text-sm uppercase">BMad Agent Framework</h4>
        <p className="text-[10px] text-muted-foreground mt-1">
          Structured prompting leveraging specific Agents and Skills for high-quality, predictable outputs.
        </p>
      </div>

      <div className="space-y-2 bg-card p-2.5 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[10px] text-foreground uppercase"><Bot size={12} className="inline mr-1 text-indigo-400" /> Agent Selection</span>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Select onValueChange={handleAgentSelect}>
            <SelectTrigger className="w-full bg-background h-8 text-xs">
              <SelectValue placeholder="Select an Agent..." />
            </SelectTrigger>
            <SelectContent>
              {AGENTS_LIST.map((agent) => (
                <SelectItem key={agent} value={agent}>🤖 {agent}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Structured Prompt:</label>
        <Textarea
          value={session.instructionsPayload.promptText}
          onChange={(e) => updateSession(draft => { draft.instructionsPayload.promptText = e.target.value; })}
          placeholder="[CONTEXT]\n...\n[EXPECTED]\n...\n[OUTPUT FORMAT]\n..."
          className="bg-background min-h-[200px] font-mono text-xs resize-y"
        />
      </div>
    </div>
  );
}

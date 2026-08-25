import React from 'react';
import { RefreshCcw, Trash2, ShieldAlert, CheckCircle2, Play, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSdlcSessionStore } from '../../core/store/useSdlcSessionStore';
import { useSdlcWorkflowMachine } from '../../core/workflow/useSdlcWorkflowMachine';

export function ResultsManagerFeature() {
  const sessionsMap = useSdlcSessionStore((s) => s.sessions);
  const activeSessionId = useSdlcSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSdlcSessionStore((s) => s.setActiveSession);
  const deleteSession = useSdlcSessionStore((s) => s.deleteSession);
  const transitionTo = useSdlcWorkflowMachine((s) => s.transitionTo);

  const sessions = Object.values(sessionsMap).sort((a, b) => b.updatedAt - a.updatedAt);

  const handleReload = (sessionId: string) => {
    setActiveSession(sessionId);
    transitionTo('LLM_CHAT');
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'error': return <ShieldAlert size={14} className="text-red-500" />;
      case 'success': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'running': return <Activity size={14} className="text-amber-500 animate-pulse" />;
      default: return <Play size={14} className="text-muted-foreground" />;
    }
  };

  return (
    <div className="flex flex-col p-4 w-full h-full min-h-0 bg-background font-mono text-xs overflow-y-auto animate-in fade-in">
      <div className="bg-card p-4 border border-border rounded-xl shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <RefreshCcw size={16} className="text-primary" />
            <h2 className="font-bold text-sm uppercase text-foreground">SDLC Session Tracker</h2>
          </div>
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded font-bold text-[10px]">
            {sessions.length} Recorded Sessions
          </span>
        </div>

        <div className="border border-border/70 rounded-md overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/60 border-b border-border/70 text-[10px] uppercase text-muted-foreground">
              <tr>
                <th className="p-2.5 w-10 text-center">Status</th>
                <th className="p-2.5 w-40">Session ID</th>
                <th className="p-2.5 w-32">Last Updated</th>
                <th className="p-2.5">Diagnostic / Message</th>
                <th className="p-2.5 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-muted-foreground italic">No SDLC workflow sessions recorded.</td>
                </tr>
              ) : (
                sessions.map(session => (
                  <tr key={session.sessionId} className={`transition-colors ${activeSessionId === session.sessionId ? 'bg-primary/5' : 'hover:bg-muted/30'}`}>
                    <td className="p-2.5 text-center">
                      <div className="flex justify-center">{getStatusIcon(session.status)}</div>
                    </td>
                    <td className="p-2.5 font-bold text-foreground">
                      {session.sessionId.split('-')[1] || session.sessionId}
                      {activeSessionId === session.sessionId && <span className="ml-2 bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[9px] uppercase">Active</span>}
                    </td>
                    <td className="p-2.5 text-muted-foreground">
                      {new Date(session.updatedAt).toLocaleTimeString()}
                    </td>
                    <td className="p-2.5">
                      <span className={`truncate block max-w-md ${session.status === 'error' ? 'text-red-400' : 'text-muted-foreground'}`}>
                        {session.errorMessage || (session.status === 'success' ? 'Pipeline execution completed.' : 'Drafting context and instructions...')}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => handleReload(session.sessionId)} className="h-7 text-[10px]">
                          <RefreshCcw size={12} className="mr-1.5" /> Reload
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteSession(session.sessionId)} className="h-7 w-7 text-destructive hover:text-destructive/80">
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

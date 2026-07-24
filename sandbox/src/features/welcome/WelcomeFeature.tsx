import React from 'react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { Switch } from '@/components/ui/switch';
import { ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';

export function WelcomeFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const { isLocked, setIsLocked } = props;

  const leftContent = (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-2 font-semibold text-foreground text-sm tracking-tight">
        <ShieldAlert className="text-primary" size={18} /> Installation Diagnostics
      </div>
      <div className="flex justify-between items-center bg-muted p-3 border border-border rounded-md">
        <div>
          <span className="font-medium text-foreground text-xs">Security Breaker</span>
          <p className="text-[11px] text-muted-foreground">Simulate a connection loss with the database.</p>
        </div>
        <div className="flex items-center" data-tooltip="Simulate connection loss">
          <Switch checked={isLocked} onCheckedChange={setIsLocked} />
        </div>
      </div>
      <div className="gap-2 grid grid-cols-2 text-xs">
        {['Node.js v20', 'Dependency Cruiser', 'SWC Parser', 'Python 3.11', 'jQAssistant', 'Neo4j Community v5'].map((check, i) => {
          const isFail = isLocked && (check.includes('Neo4j') || check.includes('jQAssistant'));
          return (
            <div key={i} className={`flex items-center gap-2 p-2 rounded border transition-colors ${isFail ? 'border-destructive/30 bg-destructive/10 text-destructive-foreground' : 'border-success/30 bg-success/10 text-success-foreground'}`}>
              {isFail ? <XCircle size={14} className="text-destructive-foreground" /> : <CheckCircle2 size={14} />}
              <span className="text-foreground">{check}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <AppLayout
      {...props}
      layoutConfig={{ showCtnWkpLeft: true }}
      panels={{ left: leftContent }}
      headers={{ leftPanelTitle: "Home" }}
    />
  );
}

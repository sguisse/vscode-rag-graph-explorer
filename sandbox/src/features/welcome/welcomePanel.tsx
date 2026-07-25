import React from 'react';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, Layout, Compass, ArrowRight } from 'lucide-react';
import { useAppContextStore } from '@/store/useAppContextStore';

export function WelcomePanel() {
  const { setActiveFeature } = useAppContextStore();

  return (
    <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background text-foreground overflow-hidden font-sans">
      <ContainerPanelHeader title="Welcome & Overview" path="workspace.center" isHiddable={false} />

      <div className="flex-1 min-h-0 overflow-y-auto p-6 md:p-8 space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-background border border-primary/20 p-8 shadow-sm">
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-semibold">
              <Sparkles size={14} className="animate-pulse" />
              <span>Welcome Feature Layout</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Graph Explorer Studio
            </h1>

            <p className="text-muted-foreground text-sm leading-relaxed">
              This feature layout displays exclusively in the <strong>Workspace Center</strong> container, hiding secondary panels for a clean welcome screen.
            </p>

            <div className="flex gap-3 pt-2">
              <Button
                size="sm"
                className="font-semibold gap-2 font-mono text-xs cursor-pointer"
                onClick={() => setActiveFeature('layout-demo')}
              >
                <Compass size={15} />
                Switch to Layout Demo
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="p-4 border-b border-border bg-muted/20">
            <CardTitle className="text-xs font-bold font-mono uppercase tracking-wider text-foreground flex items-center gap-2">
              <Layout size={14} className="text-primary" /> Active Layout Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs text-muted-foreground space-y-2 font-mono">
            <p>• <strong>workspace.center:</strong> Visible (WelcomePanel)</p>
            <p>• <strong>workspace.top / left / right / bottom:</strong> Hidden</p>
            <p>• <strong>sidebarRight:</strong> Hidden</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

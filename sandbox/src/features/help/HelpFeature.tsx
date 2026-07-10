import React from 'react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';

export function HelpFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const leftContent = (
    <div className="space-y-4 p-4 text-muted-foreground text-xs">
      <h3 className="mb-2 font-semibold text-foreground">Navigation Guide</h3>
      <p>Use <kbd className="bg-muted px-1 border border-border rounded text-[10px] text-foreground">Ctrl</kbd> or <kbd className="bg-muted px-1 border border-border rounded text-[10px] text-foreground">Cmd</kbd> + Click to multi-select.</p>
      <div className="space-y-2 mt-4 pt-4 border-border border-t">
        <p className="font-semibold text-foreground">Impact Legend</p>
        <div className="flex items-center gap-2"><div className="bg-primary/20 border border-primary rounded w-3 h-3"></div> Selected source</div>
        <div className="flex items-center gap-2"><div className="bg-destructive border border-destructive rounded w-3 h-3"></div> Callers (Upstream)</div>
        <div className="flex items-center gap-2"><div className="bg-warning border border-warning rounded w-3 h-3"></div> Callees (Downstream)</div>
      </div>
    </div>
  );

  return (
    <AppLayout
      {...props}
      layoutConfig={{ showLeft: true }}
      panels={{ left: leftContent }}
      headers={{ leftPanelTitle: "Help & Shortcuts" }}
    />
  );
}

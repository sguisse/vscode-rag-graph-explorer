import React from 'react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { ShieldAlert, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export function FallbackFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const leftContent = (
    <div className="space-y-2 p-4 text-xs">
      <div className="mb-1 font-medium text-muted-foreground text-center">Module Showcase Fallback</div>
      <div className="flex items-center gap-2 bg-success p-2 border border-success/30 rounded text-success-foreground"><CheckCircle2 size={14} className="shrink-0" /><span><strong>Success state:</strong> Action completed.</span></div>
      <div className="flex items-center gap-2 bg-destructive p-2 border border-destructive/30 rounded text-destructive-foreground"><XCircle size={14} className="shrink-0" /><span><strong>Error state:</strong> Destructive fallback triggered.</span></div>
      <div className="flex items-center gap-2 bg-warning p-2 border border-warning/30 rounded text-warning-foreground"><ShieldAlert size={14} className="shrink-0" /><span><strong>Warning state:</strong> Context missing.</span></div>
      <div className="flex items-center gap-2 bg-info p-2 border border-info/30 rounded text-info-foreground"><HelpCircle size={14} className="shrink-0" /><span>Select an active feature to load content.</span></div>
    </div>
  );

  return (
    <AppLayout
      {...props}
      layoutConfig={{ showLeft: true }}
      panels={{ left: leftContent }}
      headers={{ leftPanelTitle: "Component Viewer" }}
    />
  );
}

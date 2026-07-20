import React from 'react';
import { LeftCenterRightPanel } from '../left-center-right-panel';

export function Footer() {
  return (
    <LeftCenterRightPanel
      id="ctn-footer"
      className="fixed bottom-0 left-0 right-0 h-[40px] z-40 bg-card border-t border-border px-4 font-mono text-xs select-none w-full flex items-center text-muted-foreground"
      left={
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 font-bold">● Active Sandbox Mode</span>
        </div>
      }
      center={
        <span>AST Compilation Log: Matrix Active</span>
      }
      right={
        <div className="text-[10px] bg-muted px-2 py-0.5 rounded border border-border">
          Status: 200 OK
        </div>
      }
    />
  );
}

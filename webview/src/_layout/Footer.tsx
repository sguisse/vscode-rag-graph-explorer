import React from 'react';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { DefaultContainersSize } from '@/constants/layout-constants';

export function Footer() {
  return (
    <LeftCenterRightPanel
      id="ctn-footer"
      className="flex items-center bg-card px-3 w-full h-8 font-mono text-muted-foreground text-xs select-none"
      style={{ height: `${DefaultContainersSize.footerHeight}px` }}
      left={
        <div className="flex items-center gap-2">
          <span className="font-bold text-emerald-500">● Active Sandbox Mode</span>
        </div>
      }
      center={
        <span>AST Compilation Log: Matrix Active</span>
      }
      right={
        <div className="bg-muted px-2 py-0.5 border border-border rounded text-[10px]">
          Status: 200 OK
        </div>
      }
    />
  );
}

import React, { useState } from 'react';
import { create } from 'zustand';
import { useLayoutStore } from '@/store/useLayoutStore';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Layout, Eye, Box, SlidersHorizontal, Layers, Sparkles, Monitor, Cpu, Terminal, FolderTree, Tag, Activity, FileText, Sliders, Info } from 'lucide-react';
import { ContainerPanelHeader } from './ContainerPanelHeader';

export type WorkspaceRegionKey = 'top' | 'left' | 'center' | 'right' | 'bottom' | 'sidebarRight';

// Store tracking active version ("1" or "2") for each region (workspace panels + sidebarRight)
export const useWorkspaceContentVersionStore = create<{
  versions: Record<WorkspaceRegionKey, '1' | '2'>;
  setVersion: (region: WorkspaceRegionKey, version: '1' | '2') => void;
}>((set) => ({
  versions: {
    top: '1',
    left: '1',
    center: '1',
    right: '1',
    bottom: '1',
    sidebarRight: '1',
  },
  setVersion: (region, version) =>
    set((state) => ({
      versions: { ...state.versions, [region]: version },
    })),
}));

// Region label configuration map
export const REGION_OPTIONS: { value: WorkspaceRegionKey; label: string }[] = [
  { value: 'top', label: 'workspace.top (Top Panel)' },
  { value: 'left', label: 'workspace.left (Left Panel)' },
  { value: 'center', label: 'workspace.center (Center Main)' },
  { value: 'right', label: 'workspace.right (Right Panel)' },
  { value: 'bottom', label: 'workspace.bottom (Bottom Log)' },
  { value: 'sidebarRight', label: 'sidebarRight (Right Sidebar)' },
];

// Helper to render target content version for a given region
export function getWorkspaceContentByRegion(region: WorkspaceRegionKey, version: '1' | '2'): React.ReactNode {
  switch (region) {
    case 'top':
      return version === '2' ? <DefaultWorkspaceTopContentV2 /> : <DefaultWorkspaceTopContentV1 />;
    case 'left':
      return version === '2' ? <DefaultWorkspaceLeftContentV2 /> : <DefaultWorkspaceLeftContentV1 />;
    case 'center':
      return version === '2' ? <DefaultWorkspaceCenterContentV2 /> : <DefaultWorkspaceCenterContentV1 />;
    case 'right':
      return version === '2' ? <DefaultWorkspaceRightContentV2 /> : <DefaultWorkspaceRightContentV1 />;
    case 'bottom':
      return version === '2' ? <DefaultWorkspaceBottomContentV2 /> : <DefaultWorkspaceBottomContentV1 />;
    case 'sidebarRight':
      return version === '2' ? <DefaultSidebarRightContentV2 /> : <DefaultSidebarRightContentV1 />;
  }
}

// Interactive Workspace Content Switcher Component
export function WorkspaceContentSwitcher() {
  const [selectedRegion, setSelectedRegion] = useState<WorkspaceRegionKey>('center');
  const versions = useWorkspaceContentVersionStore((s) => s.versions);
  const setVersion = useWorkspaceContentVersionStore((s) => s.setVersion);
  const setContainerContent = useLayoutStore((s) => s.setContainerContent);

  const currentVersion = versions[selectedRegion] || '1';

  const handleRegionChange = (newRegion: WorkspaceRegionKey) => {
    setSelectedRegion(newRegion);
  };

  const handleVersionChange = (newVersion: '1' | '2') => {
    setVersion(selectedRegion, newVersion);
    const updatedContent = getWorkspaceContentByRegion(selectedRegion, newVersion);
    const targetPath = selectedRegion === 'sidebarRight' ? 'sidebarRight' : `workspace.${selectedRegion}`;
    setContainerContent(targetPath, updatedContent);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 bg-muted/40 shadow-xs p-3 border border-border rounded-lg">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 font-mono font-bold text-foreground text-xs">
          <SlidersHorizontal size={13} className="text-primary" /> Target Region:
        </label>
        <select
          id="select-workspace-region"
          value={selectedRegion}
          onChange={(e) => handleRegionChange(e.target.value as WorkspaceRegionKey)}
          className="bg-background px-2 py-1 border border-input rounded outline-none focus:ring-1 focus:ring-primary font-mono text-foreground text-xs cursor-pointer"
        >
          {REGION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 font-mono font-bold text-foreground text-xs">
          <Layers size={13} className="text-primary" /> Content Version:
        </label>
        <select
          id="select-workspace-content-version"
          value={currentVersion}
          onChange={(e) => handleVersionChange(e.target.value as '1' | '2')}
          className="bg-background px-2 py-1 border border-input rounded outline-none focus:ring-1 focus:ring-primary font-mono font-bold text-foreground text-primary text-xs cursor-pointer"
        >
          <option value="1">Content 1</option>
          <option value="2">Content 2</option>
        </select>
      </div>
    </div>
  );
}

/* ==========================================================================
   TOP WORKSPACE REGION CONTENTS (V1 & V2)
   ========================================================================== */

export function DefaultWorkspaceTopContentV1() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Top (Content 1)" path="workspace.top" />
      <div className="flex flex-1 justify-between items-center bg-muted/20 p-2 min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5"><Monitor size={13} className="text-primary" /> Workspace Top Content #1 (Default Header)</span>
        <span className="bg-primary/10 px-1.5 py-0.5 rounded font-bold text-[10px] text-primary">V1 Active</span>
      </div>
    </div>
  );
}

export function DefaultWorkspaceTopContentV2() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Top (Content 2)" path="workspace.top" />
      <div className="flex flex-1 items-center gap-4 bg-primary/10 p-2 border-primary/20 border-b min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5 font-bold text-primary"><Cpu size={13} /> Workspace Top Content #2 (System Metrics Toolbar)</span>
        <span className="bg-background px-2 py-0.5 border border-border rounded text-[10px]">CPU: 14%</span>
        <span className="bg-background px-2 py-0.5 border border-border rounded text-[10px]">RAM: 1.4 GB</span>
        <span className="bg-emerald-500/10 ml-auto px-1.5 py-0.5 rounded font-bold text-[10px] text-emerald-500">V2 Active</span>
      </div>
    </div>
  );
}

/* ==========================================================================
   LEFT WORKSPACE REGION CONTENTS (V1 & V2)
   ========================================================================== */

export function DefaultWorkspaceLeftContentV1() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Left (Content 1)" path="workspace.left" />
      <div className="flex-1 space-y-2 bg-muted/10 p-3 min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <p className="flex items-center gap-1.5 font-bold text-foreground"><FolderTree size={14} className="text-primary" /> Left Panel V1: File Hierarchy</p>
        <ul className="space-y-1 text-[11px] list-disc list-inside">
          <li>src/components/app/layout</li>
          <li>src/store/useLayoutStore.ts</li>
          <li>src/services/codebase</li>
        </ul>
      </div>
    </div>
  );
}

export function DefaultWorkspaceLeftContentV2() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Left (Content 2)" path="workspace.left" />
      <div className="flex-1 space-y-2 bg-indigo-500/5 p-3 border-indigo-500/20 border-r min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <p className="flex items-center gap-1.5 font-bold text-indigo-500"><Tag size={14} /> Left Panel V2: Filter Presets</p>
        <div className="flex flex-wrap gap-1 mt-2">
          <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] text-indigo-500">#ast</span>
          <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] text-indigo-500">#zustand</span>
          <span className="bg-indigo-500/10 px-2 py-0.5 rounded text-[10px] text-indigo-500">#layout</span>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   CENTER WORKSPACE REGION CONTENTS (V1 & V2)
   ========================================================================== */

export function DefaultWorkspaceCenterContentV1() {
  const { toggleContainerVisible, resetContainers } = useLayoutStore();

  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Center (Content 1)" path="workspace.center" />
      <div className="flex flex-col flex-1 justify-start items-center space-y-4 p-6 min-h-0 overflow-y-auto font-mono text-xs">
        <Card className="bg-card shadow-md border-border w-full max-w-2xl">
          <CardHeader className="bg-muted/30 p-4 border-border border-b">
            <CardTitle className="flex items-center gap-2 font-bold text-foreground text-sm">
              <Layout className="text-primary" size={18} /> Layout Management & Zustand State Store Showcase (V1)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
                <Sparkles size={14} className="text-primary" /> Workspace & Sidebar Content Version Switcher
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Select a target region and switch between <strong>Content 1</strong> and <strong>Content 2</strong> dynamically via `useLayoutStore`:
              </p>
              <WorkspaceContentSwitcher />
            </div>

            <div className="space-y-2 pt-2 border-border border-t">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
                <SlidersHorizontal size={14} className="text-primary" /> Interactive Container Visibility Controls
              </h4>
              <div className="gap-2 grid grid-cols-3">
                <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('sidebarLeft')}>
                  <Eye size={12} className="mr-1" /> Toggle Left Sidebar
                </Button>

                <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.top')}>
                  <Eye size={12} className="mr-1" /> Toggle Wkp Top
                </Button>

                <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.left')}>
                  <Eye size={12} className="mr-1" /> Toggle Wkp Left
                </Button>

                <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.right')}>
                  <Eye size={12} className="mr-1" /> Toggle Wkp Right
                </Button>

                <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('workspace.bottom')}>
                  <Eye size={12} className="mr-1" /> Toggle Wkp Bottom
                </Button>

                <Button variant="outline" size="sm" className="text-[11px]" onClick={() => toggleContainerVisible('sidebarRight')}>
                  <Eye size={12} className="mr-1" /> Toggle Right Sidebar
                </Button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-border border-t">
              <Button size="sm" variant="secondary" className="font-mono text-xs" onClick={resetContainers}>
                Reset All Layout Containers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function DefaultWorkspaceCenterContentV2() {
  const { resetContainers } = useLayoutStore();

  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Center (Content 2)" path="workspace.center" />
      <div className="flex flex-col flex-1 justify-start items-center space-y-4 p-6 min-h-0 overflow-y-auto font-mono text-xs">
        <Card className="bg-card shadow-md border-primary/30 w-full max-w-2xl">
          <CardHeader className="bg-primary/5 p-4 border-primary/20 border-b">
            <CardTitle className="flex items-center gap-2 font-bold text-primary text-sm">
              <Box className="text-primary animate-pulse" size={18} /> Center Main Panel - Content Variant #2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-4">
            <p className="text-muted-foreground text-xs leading-relaxed">
              This is <strong>Center Content Variant #2</strong>, loaded reactively using Zustand store mutation.
            </p>

            <div className="space-y-2">
              <h4 className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
                <SlidersHorizontal size={14} className="text-primary" /> Switch Target Region & Version
              </h4>
              <WorkspaceContentSwitcher />
            </div>

            <div className="flex justify-end pt-2 border-border border-t">
              <Button size="sm" variant="outline" className="font-mono text-xs" onClick={resetContainers}>
                Reset Default Layout Content
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/* ==========================================================================
   RIGHT WORKSPACE REGION CONTENTS (V1 & V2)
   ========================================================================== */

export function DefaultWorkspaceRightContentV1() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Right (Content 1)" path="workspace.right" />
      <div className="flex-1 space-y-1 bg-muted/10 p-3 min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <p className="flex items-center gap-1.5 font-bold text-foreground"><FileText size={14} className="text-primary" /> Right Panel V1: Specs Overview</p>
        <p className="text-[11px]">Properties inspector & AST metadata summary.</p>
      </div>
    </div>
  );
}

export function DefaultWorkspaceRightContentV2() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Right (Content 2)" path="workspace.right" />
      <div className="flex-1 space-y-1 bg-amber-500/5 p-3 border-amber-500/20 border-l min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <p className="flex items-center gap-1.5 font-bold text-amber-500"><Activity size={14} /> Right Panel V2: Live Diagnostics</p>
        <p className="text-[11px]">Real-time node telemetry & topology statistics.</p>
      </div>
    </div>
  );
}

/* ==========================================================================
   BOTTOM WORKSPACE REGION CONTENTS (V1 & V2)
   ========================================================================== */

export function DefaultWorkspaceBottomContentV1() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Bottom (Content 1)" path="workspace.bottom" />
      <div className="flex flex-1 justify-between items-center bg-muted/20 p-2 min-h-0 overflow-auto font-mono text-muted-foreground text-xs">
        <span className="flex items-center gap-1.5"><Terminal size={13} /> Bottom Panel V1: Output Console Stream</span>
        <span className="text-[10px] text-muted-foreground">Status: Ready</span>
      </div>
    </div>
  );
}

export function DefaultWorkspaceBottomContentV2() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Workspace Bottom (Content 2)" path="workspace.bottom" />
      <div className="flex-1 bg-slate-950 p-2 min-h-0 overflow-auto font-mono text-emerald-400 text-xs">
        <div>$ vscode-graph-explorer --watch</div>
        <div className="text-[10px] text-slate-400">✔ Zustand layout store initialized successfully.</div>
      </div>
    </div>
  );
}

/* ==========================================================================
   SIDEBAR RIGHT CONTENTS (V1 & V2)
   ========================================================================== */

export function DefaultSidebarRightContentV1() {
  const sidebarTitle = (
    <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase">
      <Sliders size={13} className="text-primary shrink-0" />
      <span className="truncate">Right Sidebar Inspector (Content 1)</span>
    </div>
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden font-mono text-card-foreground text-xs">
      <ContainerPanelHeader title={sidebarTitle} path="sidebarRight" />
      <div className="flex-1 space-y-2 p-3 min-h-0 overflow-y-auto text-muted-foreground">
        <p className="flex items-center gap-1 text-[11px]">
          <Info size={12} className="text-primary shrink-0" /> Dynamic layout container right sidebar active (Content Variant #1).
        </p>
      </div>
    </div>
  );
}

export function DefaultSidebarRightContentV2() {
  const sidebarTitle = (
    <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-500 uppercase">
      <Activity size={13} className="shrink-0" />
      <span className="truncate">Right Sidebar Inspector (Content 2)</span>
    </div>
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden font-mono text-card-foreground text-xs">
      <ContainerPanelHeader title={sidebarTitle} path="sidebarRight" />
      <div className="flex-1 space-y-2 bg-amber-500/5 p-3 border-amber-500/20 border-l min-h-0 overflow-y-auto text-muted-foreground">
        <p className="flex items-center gap-1 font-bold text-[11px] text-amber-500">
          <Activity size={12} className="shrink-0" /> Real-time Node Telemetry & Secondary Inspector (Content Variant #2).
        </p>
        <div className="space-y-1 bg-background/80 p-2 border border-border rounded text-[10px] text-foreground">
          <div>Telemetry Stream: Online</div>
          <div>Heap Memory: 38MB / 128MB</div>
          <div>Cytoscape Workers: 2 Active</div>
        </div>
      </div>
    </div>
  );
}

/* Default container map exported for initial application render */
export const defaultLayoutContainersContent = {
  top: <DefaultWorkspaceTopContentV1 />,
  left: <DefaultWorkspaceLeftContentV1 />,
  center: <DefaultWorkspaceCenterContentV1 />,
  right: <DefaultWorkspaceRightContentV1 />,
  bottom: <DefaultWorkspaceBottomContentV1 />,
  sidebarRight: <DefaultSidebarRightContentV1 />,
};

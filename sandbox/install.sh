#!/usr/bin/env bash
# ============================================================================
# Final Enterprise SOLID Remediation & Architecture Completion Script
# ============================================================================

set -e

# Create required directories
mkdir -p src/components/app/layout/hooks
mkdir -p src/features/explorer/wksp-cnt-graph/components/graph
mkdir -p src/features/explorer/wkp-lft-codebase-tree
mkdir -p src/features/explorer/wkp-rgt-tabs-inspector
mkdir -p src/features/explorer/sdb-rgt-properties
mkdir -p src/features/explorer/wkp-top-paths
mkdir -p src/features/explorer/wkp-btm-infos

# ----------------------------------------------------------------------------
# 1. ISP: Layout State Management Hook (src/components/app/layout/hooks/use-layout-state.ts)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/hooks/use-layout-state.ts
import { useState } from 'react';
import { AppLayoutConfig } from '../AppLayout';

export interface LayoutVisibilityState {
  isCtnWorkspaceVisible: boolean;
  isCtnWorkspaceTopVisible: boolean;
  isCtnWorkspaceLeftVisible: boolean;
  isCtnWorkspaceCenterVisible: boolean;
  isCtnWorkspaceRightVisible: boolean;
  isCtnWorkspaceBottomVisible: boolean;
  isSidebarRightVisible: boolean;
}

export interface LayoutVisibilityActions {
  setIsCtnWorkspaceVisible: (visible: boolean) => void;
  setIsCtnWorkspaceTopVisible: (visible: boolean) => void;
  setIsCtnWorkspaceLeftVisible: (visible: boolean) => void;
  setIsCtnWorkspaceCenterVisible: (visible: boolean) => void;
  setIsCtnWorkspaceRightVisible: (visible: boolean) => void;
  setIsCtnWorkspaceBottomVisible: (visible: boolean) => void;
  setIsSidebarRightVisible: (visible: boolean) => void;
}

export function useLayoutState(layoutConfig: AppLayoutConfig = {}) {
  const [isCtnWorkspaceVisible, setIsCtnWorkspaceVisible] = useState(true);
  const [isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible] = useState(layoutConfig.showTop ?? false);
  const [isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible] = useState(layoutConfig.showLeft ?? false);
  const [isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible] = useState(layoutConfig.showCenter ?? false);
  const [isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible] = useState(layoutConfig.showRight ?? false);
  const [isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible] = useState(layoutConfig.showBottom ?? false);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(layoutConfig.showRightSidebar ?? false);

  const visibility: LayoutVisibilityState = {
    isCtnWorkspaceVisible,
    isCtnWorkspaceTopVisible,
    isCtnWorkspaceLeftVisible,
    isCtnWorkspaceCenterVisible,
    isCtnWorkspaceRightVisible,
    isCtnWorkspaceBottomVisible,
    isSidebarRightVisible
  };

  const actions: LayoutVisibilityActions = {
    setIsCtnWorkspaceVisible,
    setIsCtnWorkspaceTopVisible,
    setIsCtnWorkspaceLeftVisible,
    setIsCtnWorkspaceCenterVisible,
    setIsCtnWorkspaceRightVisible,
    setIsCtnWorkspaceBottomVisible,
    setIsSidebarRightVisible
  };

  return { visibility, actions };
}
EOF

# ----------------------------------------------------------------------------
# 2. Header Component (src/components/app/layout/header.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/header.tsx
import React from 'react';
import { Search, Upload, Download, Moon, Sun, RotateCcw, Eye, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { LayoutVisibilityState, LayoutVisibilityActions } from './hooks/use-layout-state';
import { AppLayoutConfig } from './AppLayout';

export interface HeaderProps {
  sidebarLeftMode: 'normal' | 'minimal' | 'collapsed';
  setSidebarLeftMode: React.Dispatch<React.SetStateAction<'normal' | 'minimal' | 'collapsed'>>;
  searchTerm: string;
  onSearchChange?: (val: string) => void;
  isLocked: boolean;
  setImportOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetFilters?: () => void;
  visibility: LayoutVisibilityState;
  actions: LayoutVisibilityActions;
  layoutConfig: AppLayoutConfig;
}

export function Header({
  setSidebarLeftMode,
  searchTerm,
  onSearchChange,
  isLocked,
  setImportOpen,
  setExportOpen,
  isDarkMode,
  setIsDarkMode,
  onResetFilters,
  visibility,
  actions,
  layoutConfig
}: HeaderProps) {
  return (
    <LeftCenterRightPanel
      id="ctn-header"
      className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
      left={
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')}
            className="w-8 h-8 text-muted-foreground hover:text-foreground"
            data-tooltip="Toggle primary navigation drawer"
          >
            <Menu size={16} />
          </Button>
          <div className="flex items-center gap-2 ml-1 text-primary cursor-help">
            <span className="font-bold text-foreground text-xs tracking-tight">Archi-Polyglot Workspace</span>
          </div>
        </>
      }
      center={
        <div className="relative flex items-center w-full max-w-md">
          <Search className="left-2 absolute text-muted-foreground" size={14} />
          <Input
            type="text"
            placeholder="Search for an AST entity (e.g., UserController)..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="bg-muted pl-8 h-8 text-xs"
            disabled={isLocked}
            data-tooltip="Enter FQN token to globally query code index structures"
          />
        </div>
      }
      right={
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setImportOpen(true)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Import local AST JSON/YAML schema payload extracts"><Upload size={16} /></Button>
          <Button variant="ghost" size="icon" onClick={() => setExportOpen(true)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Export current topological session structure"><Download size={16} /></Button>
          <div className="mx-1 bg-border w-px h-4"></div>
          <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip={isDarkMode ? "Switch to crisp light mode theme" : "Switch to immersive dark mode theme"}>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Button>
          {onResetFilters && <Button variant="ghost" size="icon" onClick={onResetFilters} className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors" data-tooltip="Reset all workspace visual states, filters, and matrices"><RotateCcw size={16} /></Button>}
          <div className="mx-1 bg-border w-px h-4"></div>
          <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceVisible(!visibility.isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`} data-tooltip="Toggle core workspace frame canvas wrapper"><Eye size={16} /></Button>

          {layoutConfig.showTop && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceTopVisible(!visibility.isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle workspace mapping path summary rows"><Eye size={16} /></Button>}
          {layoutConfig.showLeft && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceLeftVisible(!visibility.isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle multi-layer filter explorer stream"><Eye size={16} /></Button>}
          {layoutConfig.showCenter && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceCenterVisible(!visibility.isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle center interactive stage"><Eye size={16} /></Button>}
          {layoutConfig.showRight && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceRightVisible(!visibility.isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle right sub-workspace tab inspect matrices"><Eye size={16} /></Button>}
          {layoutConfig.showBottom && <Button variant="ghost" size="icon" onClick={() => actions.setIsCtnWorkspaceBottomVisible(!visibility.isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle bottom system real-time runtime status log bars"><Eye size={16} /></Button>}
          {layoutConfig.showRightSidebar && (
            <>
              <div className="mx-1 bg-border w-px h-4"></div>
              <Button variant="ghost" size="icon" onClick={() => actions.setIsSidebarRightVisible(!visibility.isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${visibility.isSidebarRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle far-right global identity properties side-drawer"><Eye size={16} /></Button>
            </>
          )}
        </div>
      }
    />
  );
}
EOF

# ----------------------------------------------------------------------------
# 3. Sidebar Left Component (src/components/app/layout/sidebar-left.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/sidebar-left.tsx
import React from 'react';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuBadge, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, LayoutDashboard, FolderTree, Scale, Terminal, History, Settings, HelpCircle, FileJson } from 'lucide-react';

const SIDEBAR_MENU_ITEMS = [
  { id: 'panel-welcome', icon: LayoutDashboard, label: 'Home' },
  { id: 'panel-explorer', icon: FolderTree, label: 'AST Explorer', badge: 'New' },
  { id: 'panel-rules', icon: Scale, label: 'Cypher Rules' },
  { id: 'panel-prompt', icon: FileJson, label: 'GraphRAG Prompt' },
  { id: 'panel-terminal', icon: Terminal, label: 'CLI Terminal' },
  { id: 'panel-history', icon: History, label: 'History' },
  { id: 'panel-configuration', icon: Settings, label: 'Configuration', bottom: true },
  { id: 'panel-help', icon: HelpCircle, label: 'Help & Shortcuts', bottom: true }
];

export interface SidebarLeftProps {
  sidebarLeftMode: 'normal' | 'minimal' | 'collapsed';
  setSidebarLeftMode: React.Dispatch<React.SetStateAction<'normal' | 'minimal' | 'collapsed'>>;
  activeView: string;
  setActiveView: (view: string) => void;
  sidebarLeftWidth: number;
  startSidebarLeftResize: (e: React.MouseEvent) => void;
  isDraggingSidebarLeft: boolean;
}

export function SidebarLeft({
  sidebarLeftMode,
  setSidebarLeftMode,
  activeView,
  setActiveView,
  sidebarLeftWidth,
  startSidebarLeftResize,
  isDraggingSidebarLeft
}: SidebarLeftProps) {
  if (sidebarLeftMode === 'collapsed') return null;

  const renderSidebarMenuItem = (item: any) => (
    <SidebarMenuItem key={item.id}>
      <SidebarMenuButton
        id={`btn-menu-${item.id}`}
        isActive={activeView === item.id}
        onClick={() => setActiveView(item.id)}
        title={sidebarLeftMode === 'minimal' ? item.label : undefined}
        className="relative"
      >
        <item.icon size={16} className={sidebarLeftMode === 'normal' ? "mr-2.5 shrink-0" : "shrink-0"} />
        {sidebarLeftMode === 'normal' ? (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </>
        ) : (
          item.badge && (
            <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground font-mono font-bold text-[8px] px-1 py-0.5 rounded-full select-none scale-85 origin-top-right shadow-2xs leading-none">
              {item.badge}
            </span>
          )
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar
      id="ctn-sidebar-left"
      style={{
        width: sidebarLeftMode === 'minimal' ? '56px' : `${sidebarLeftWidth}px`,
        '--sidebar-width': `${sidebarLeftWidth}px`,
        transition: isDraggingSidebarLeft ? 'none' : undefined
      } as React.CSSProperties}
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {SIDEBAR_MENU_ITEMS.filter(item => !item.bottom).map(renderSidebarMenuItem)}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-auto pt-2 border-sidebar-border border-t">
          <SidebarMenu>
            {SIDEBAR_MENU_ITEMS.filter(item => item.bottom).map(renderSidebarMenuItem)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSidebarLeftMode(m => m === 'normal' ? 'minimal' : 'normal')}
          className={`w-full text-muted-foreground hover:text-foreground ${sidebarLeftMode === 'normal' ? 'justify-end' : 'justify-center'}`}
          data-tooltip="Toggle sidebar drawer size"
        >
          {sidebarLeftMode === 'normal' ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
        </Button>
      </SidebarFooter>
      {sidebarLeftMode === 'normal' && (
        <div className="group top-0 right-0 bottom-0 z-20 absolute hover:bg-sidebar-border w-1 cursor-col-resize" onMouseDown={startSidebarLeftResize} />
      )}
    </Sidebar>
  );
}
EOF

# ----------------------------------------------------------------------------
# 4. Workspace Component (src/components/app/layout/workspace.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/workspace.tsx
import React from 'react';
import { ResizableContainer } from '@/components/app/container/resizable-container';

export interface WorkspaceProps {
  isCtnWorkspaceVisible: boolean;
  layoutConfig: {
    showTop?: boolean;
    showLeft?: boolean;
    showCenter?: boolean;
    showRight?: boolean;
    showBottom?: boolean;
  };
  isCtnWorkspaceTopVisible: boolean;
  ctnWorkspaceTopHeight: number;
  startCtnWorkspaceTopResize: (e: React.MouseEvent) => void;
  panels: {
    top?: React.ReactNode;
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    bottom?: React.ReactNode;
  };
  headers: {
    leftPanelTitle?: string;
    centerPanelHeader?: React.ReactNode;
    centerPanelHeaderCenter?: React.ReactNode;
    centerPanelHeaderRight?: React.ReactNode;
  };
  isCtnWorkspaceLeftVisible: boolean;
  activeMiddlePanelsCount: number;
  ctnWorkspaceLeftWidth: number;
  activeView: string;
  startCtnWorkspaceLeftResize: (e: React.MouseEvent) => void;
  isCtnWorkspaceCenterVisible: boolean;
  isGraphMaximized: boolean;
  isCurrentlyResizing: boolean;
  isDraggingSidebarLeft: boolean;
  isDraggingSidebarRight: boolean;
  isDraggingLeftPane: boolean;
  isDraggingRightPane: boolean;
  isCtnWorkspaceRightVisible: boolean;
  ctnWorkspaceRightWidth: number;
  startCtnWorkspaceRightResize: (e: React.MouseEvent) => void;
  isCtnWorkspaceBottomVisible: boolean;
  ctnWorkspaceBottomHeight: number;
  startCtnWorkspaceBottomResize: (e: React.MouseEvent) => void;
}

export function Workspace({
  isCtnWorkspaceVisible,
  layoutConfig,
  isCtnWorkspaceTopVisible,
  ctnWorkspaceTopHeight,
  startCtnWorkspaceTopResize,
  panels,
  headers,
  isCtnWorkspaceLeftVisible,
  activeMiddlePanelsCount,
  ctnWorkspaceLeftWidth,
  activeView,
  startCtnWorkspaceLeftResize,
  isCtnWorkspaceCenterVisible,
  isGraphMaximized,
  isCurrentlyResizing,
  isDraggingSidebarLeft,
  isDraggingSidebarRight,
  isDraggingLeftPane,
  isDraggingRightPane,
  isCtnWorkspaceRightVisible,
  ctnWorkspaceRightWidth,
  startCtnWorkspaceRightResize,
  isCtnWorkspaceBottomVisible,
  ctnWorkspaceBottomHeight,
  startCtnWorkspaceBottomResize,
}: WorkspaceProps) {
  return (
    <div id="ctn-workspace" style={{ display: isCtnWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
      <div className="relative flex flex-col flex-1 min-w-0">

        {/* TOP PANEL */}
        {layoutConfig.showTop && (
          <ResizableContainer id="ctn-workspace-top" visible={isCtnWorkspaceTopVisible} style={{ height: `${ctnWorkspaceTopHeight}px` }} headerLeft="Target Path Mapping Streams" resizeHandle="bottom" onResizeStart={startCtnWorkspaceTopResize} className="bg-muted border-b">
            {panels.top}
          </ResizableContainer>
        )}

        <div id="ctn-workspace-middle-row" className="flex flex-1 min-h-0 overflow-hidden">

          {/* LEFT PANEL */}
          {layoutConfig.showLeft && (
            <ResizableContainer
              id="ctn-workspace-left"
              visible={isCtnWorkspaceLeftVisible}
              style={activeMiddlePanelsCount === 1 ? { flex: 1 } : { width: `${ctnWorkspaceLeftWidth}px` }}
              headerLeft={headers.leftPanelTitle || activeView}
              className={activeMiddlePanelsCount === 1 ? "min-w-[200px]" : "border-r min-w-[200px]"}
              resizeHandle={activeMiddlePanelsCount > 1 ? "right" : "none"}
              onResizeStart={startCtnWorkspaceLeftResize}
            >
              {panels.left}
            </ResizableContainer>
          )}

          {/* CENTER PANEL */}
          {layoutConfig.showCenter && (
            <ResizableContainer
              id="ctn-workspace-center"
              visible={isCtnWorkspaceCenterVisible || isGraphMaximized}
              style={isGraphMaximized ? { position: 'fixed', top: '40px', bottom: '40px', left: '0', right: '0', zIndex: 50 } : { flex: 1 }}
              headerLeft={headers.centerPanelHeader}
              headerCenter={headers.centerPanelHeaderCenter}
              headerRight={headers.centerPanelHeaderRight}
              className="relative bg-background"
            >
              {panels.center}
              {isCurrentlyResizing && <div className="z-30 absolute inset-0 bg-transparent pointer-events-auto select-none" style={{ cursor: isDraggingSidebarLeft || isDraggingSidebarRight || isDraggingLeftPane || isDraggingRightPane ? 'col-resize' : 'row-resize' }} />}
            </ResizableContainer>
          )}

          {/* RIGHT PANEL */}
          {layoutConfig.showRight && (
            <ResizableContainer
              id="ctn-workspace-right"
              visible={isCtnWorkspaceRightVisible}
              style={(!isCtnWorkspaceCenterVisible || activeMiddlePanelsCount === 1) ? { flex: 1 } : { width: `${ctnWorkspaceRightWidth}px` }}
              headerLeft="Metadata & Inspector Tab Matrices"
              className={(!isCtnWorkspaceCenterVisible || activeMiddlePanelsCount === 1) ? "min-w-[200px]" : "border-l min-w-[200px]"}
              resizeHandle={isCtnWorkspaceCenterVisible ? "left" : "none"}
              onResizeStart={isCtnWorkspaceCenterVisible ? startCtnWorkspaceRightResize : undefined}
            >
              {panels.right}
            </ResizableContainer>
          )}
        </div>

        {/* BOTTOM PANEL */}
        {layoutConfig.showBottom && (
          <ResizableContainer id="ctn-workspace-bottom" visible={isCtnWorkspaceBottomVisible} style={{ height: `${ctnWorkspaceBottomHeight}px` }} className="bg-secondary border-t" resizeHandle="top" onResizeStart={startCtnWorkspaceBottomResize}>
            {panels.bottom}
          </ResizableContainer>
        )}
      </div>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 5. Sidebar Right Component (src/components/app/layout/sidebar-right.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/sidebar-right.tsx
import React from 'react';
import { ResizableContainer } from '@/components/app/container/resizable-container';

export interface SidebarRightProps {
  layoutConfig: {
    showRightSidebar?: boolean;
  };
  isSidebarRightVisible: boolean;
  sidebarRightWidth: number;
  headers: {
    rightSidebarHeader?: React.ReactNode;
    rightSidebarHeaderRight?: React.ReactNode;
  };
  panels: {
    rightSidebar?: React.ReactNode;
  };
  startSidebarRightResize: (e: React.MouseEvent) => void;
}

export function SidebarRight({
  layoutConfig,
  isSidebarRightVisible,
  sidebarRightWidth,
  headers,
  panels,
  startSidebarRightResize
}: SidebarRightProps) {
  if (!layoutConfig.showRightSidebar) return null;

  return (
    <ResizableContainer
      id="ctn-sidebar-right"
      visible={isSidebarRightVisible}
      style={{ width: `${sidebarRightWidth}px` }}
      headerLeft={headers.rightSidebarHeader}
      headerRight={headers.rightSidebarHeaderRight}
      className="border-l shrink-0"
      resizeHandle="left"
      onResizeStart={startSidebarRightResize}
    >
      {panels.rightSidebar}
    </ResizableContainer>
  );
}
EOF

# ----------------------------------------------------------------------------
# 6. Fixed 40px Footer Component (src/components/app/layout/footer.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/footer.tsx
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
EOF

# ----------------------------------------------------------------------------
# 7. Main AppLayout Component (src/components/app/layout/AppLayout.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip } from '@/components/app/tooltip';
import { useResizable } from '@/components/app/container/hooks/use-resizable';
import { Header } from './header';
import { SidebarLeft } from './sidebar-left';
import { Workspace } from './workspace';
import { SidebarRight } from './sidebar-right';
import { Footer } from './footer';
import { useLayoutState } from './hooks/use-layout-state';

export interface AppLayoutConfig {
  showTop?: boolean;
  showLeft?: boolean;
  showCenter?: boolean;
  showRight?: boolean;
  showBottom?: boolean;
  showRightSidebar?: boolean;
}

export interface AppLayoutProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  isLocked: boolean;
  setIsLocked: (val: boolean) => void;

  layoutConfig?: AppLayoutConfig;

  panels?: {
    top?: React.ReactNode;
    left?: React.ReactNode;
    center?: React.ReactNode;
    right?: React.ReactNode;
    bottom?: React.ReactNode;
    rightSidebar?: React.ReactNode;
  };

  headers?: {
    center?: React.ReactNode;
    right?: React.ReactNode;
    leftPanelTitle?: string;
    centerPanelHeader?: React.ReactNode;
    centerPanelHeaderCenter?: React.ReactNode;
    centerPanelHeaderRight?: React.ReactNode;
    rightSidebarHeader?: React.ReactNode;
    rightSidebarHeaderRight?: React.ReactNode;
  };

  onResetFilters?: () => void;
  searchTerm?: string;
  onSearchChange?: (val: string) => void;
  notification?: string | null;
  isGraphMaximized?: boolean;
}

export function AppLayout({
  activeView,
  setActiveView,
  isDarkMode,
  setIsDarkMode,
  isLocked,
  setIsLocked,
  layoutConfig = {},
  panels = {},
  headers = {},
  onResetFilters,
  searchTerm = "",
  onSearchChange,
  notification,
  isGraphMaximized = false,
}: AppLayoutProps) {

  const [sidebarLeftMode, setSidebarLeftMode] = useState<'normal' | 'minimal' | 'collapsed'>('normal');
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // Consolidated layout visibility state via hook (ISP)
  const { visibility, actions } = useLayoutState(layoutConfig);

  // Resizable hooks
  const [sidebarLeftWidth, startSidebarLeftResize, isDraggingSidebarLeft] = useResizable(220, 160, 400, true, false, 60);
  const [sidebarRightWidth, startSidebarRightResize, isDraggingSidebarRight] = useResizable(300, 200, 500, true, true, 80);
  const [ctnWorkspaceLeftWidth, startCtnWorkspaceLeftResize, isDraggingLeftPane] = useResizable(260, 180, 500, true, false);
  const [ctnWorkspaceRightWidth, startCtnWorkspaceRightResize, isDraggingRightPane] = useResizable(320, 200, 600, true, true);
  const [ctnWorkspaceTopHeight, startCtnWorkspaceTopResize, isDraggingTopPane] = useResizable(120, 50, 250, false, false);
  const [ctnWorkspaceBottomHeight, startCtnWorkspaceBottomResize, isDraggingBottomPane] = useResizable(30, 30, 400, false, true);

  const isCurrentlyResizing = isDraggingSidebarLeft || isDraggingSidebarRight || isDraggingLeftPane || isDraggingRightPane || isDraggingTopPane || isDraggingBottomPane;

  const activeMiddlePanelsCount =
    (visibility.isCtnWorkspaceLeftVisible ? 1 : 0) +
    (visibility.isCtnWorkspaceCenterVisible ? 1 : 0) +
    (visibility.isCtnWorkspaceRightVisible ? 1 : 0);

  return (
    <div id="ctn-root" className={`flex flex-col h-screen w-screen overflow-hidden font-sans text-sm select-none transition-colors duration-200 bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>

      {notification && (
        <div className="top-12 left-1/2 z-50 fixed flex items-center gap-2 bg-primary slide-in-from-top-4 shadow-2xl px-4 py-2.5 rounded-full font-mono text-primary-foreground text-xs -translate-x-1/2 animate-in transform fade-in">
          {notification}
        </div>
      )}

      <Header
        sidebarLeftMode={sidebarLeftMode}
        setSidebarLeftMode={setSidebarLeftMode}
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        isLocked={isLocked}
        setImportOpen={setImportOpen}
        setExportOpen={setExportOpen}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        onResetFilters={onResetFilters}
        visibility={visibility}
        actions={actions}
        layoutConfig={layoutConfig}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader><DialogTitle className="text-foreground text-sm">Import AST Data Schema</DialogTitle></DialogHeader>
          <div className="p-2 border border-dashed rounded text-muted-foreground text-xs text-center">Select local extraction file payload</div>
        </DialogContent>
      </Dialog>

      <div id="ctn-main" className="relative flex flex-1 overflow-hidden pb-[40px]">

        <SidebarLeft
          sidebarLeftMode={sidebarLeftMode}
          setSidebarLeftMode={setSidebarLeftMode}
          activeView={activeView}
          setActiveView={setActiveView}
          sidebarLeftWidth={sidebarLeftWidth}
          startSidebarLeftResize={startSidebarLeftResize}
          isDraggingSidebarLeft={isDraggingSidebarLeft}
        />

        <Workspace
          isCtnWorkspaceVisible={visibility.isCtnWorkspaceVisible}
          layoutConfig={layoutConfig}
          isCtnWorkspaceTopVisible={visibility.isCtnWorkspaceTopVisible}
          ctnWorkspaceTopHeight={ctnWorkspaceTopHeight}
          startCtnWorkspaceTopResize={startCtnWorkspaceTopResize}
          panels={panels}
          headers={headers}
          isCtnWorkspaceLeftVisible={visibility.isCtnWorkspaceLeftVisible}
          activeMiddlePanelsCount={activeMiddlePanelsCount}
          ctnWorkspaceLeftWidth={ctnWorkspaceLeftWidth}
          activeView={activeView}
          startCtnWorkspaceLeftResize={startCtnWorkspaceLeftResize}
          isCtnWorkspaceCenterVisible={visibility.isCtnWorkspaceCenterVisible}
          isGraphMaximized={isGraphMaximized}
          isCurrentlyResizing={isCurrentlyResizing}
          isDraggingSidebarLeft={isDraggingSidebarLeft}
          isDraggingSidebarRight={isDraggingSidebarRight}
          isDraggingLeftPane={isDraggingLeftPane}
          isDraggingRightPane={isDraggingRightPane}
          isCtnWorkspaceRightVisible={visibility.isCtnWorkspaceRightVisible}
          ctnWorkspaceRightWidth={ctnWorkspaceRightWidth}
          startCtnWorkspaceRightResize={startCtnWorkspaceRightResize}
          isCtnWorkspaceBottomVisible={visibility.isCtnWorkspaceBottomVisible}
          ctnWorkspaceBottomHeight={ctnWorkspaceBottomHeight}
          startCtnWorkspaceBottomResize={startCtnWorkspaceBottomResize}
        />

        <SidebarRight
          layoutConfig={layoutConfig}
          isSidebarRightVisible={visibility.isSidebarRightVisible}
          sidebarRightWidth={sidebarRightWidth}
          headers={headers}
          panels={panels}
          startSidebarRightResize={startSidebarRightResize}
        />

      </div>

      <Footer />

      <Tooltip delay={1500} />
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 8. Decoupled Cytoscape Hooks (SRP)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/useCytoscapeInstance.ts
import { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';

export interface GraphState {
  zoom: number;
  pan: { x: number; y: number };
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
}

export function useCytoscapeInstance(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [graphState, setGraphState] = useState<GraphState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    nodePositions: {}
  });

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        { selector: 'node[width][height]', style: { 'shape': 'rectangle', 'opacity': 0.0, 'width': 'data(width)', 'height': 'data(height)' } },
        { selector: 'node.folder', style: { 'shape': 'rectangle', 'opacity': 1.0, 'label': 'data(label)', 'text-valign': 'top', 'text-halign': 'center', 'text-margin-y': -12, 'font-size': '12px', 'font-family': 'monospace', 'font-weight': 'bold', 'color': isDarkMode ? '#94a3b8' : '#475569', 'background-opacity': 0.02, 'background-color': isDarkMode ? '#475569' : '#94a3b8', 'border-width': '2px', 'border-color': isDarkMode ? '#334155' : '#cbd5e1', 'border-style': 'dashed', 'padding': '40' } },
        { selector: 'edge', style: { 'width': 2, 'line-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-color': isDarkMode ? '#475569' : '#cbd5e1', 'target-arrow-shape': 'triangle', 'curve-style': 'bezier', 'label': 'data(label)', 'font-size': '9px', 'font-family': 'monospace', 'color': isDarkMode ? '#94a3b8' : '#475569', 'text-background-opacity': 1, 'text-background-color': isDarkMode ? '#18181b' : '#ffffff', 'text-background-padding': '3px', 'text-background-shape': 'roundrectangle' } },
        { selector: 'edge.impacted', style: { 'line-color': '#f97316', 'target-arrow-color': '#f97316', 'width': 4 } }
      ],
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false
    });

    cyRef.current = cy;

    cy.on('tap', 'node', (evt) => {
      if (!evt.target.hasClass('folder')) {
        onNodeSelect(evt.target.id());
      }
    });

    const syncGraph = () => {
      const positions: Record<string, { x: number; y: number; w: number; h: number }> = {};
      cy.nodes().forEach(node => {
        if (node.hasClass('folder')) return;
        const bb = node.boundingBox({ includeLabels: false, includeEdges: false });
        positions[node.id()] = { x: bb.x1, y: bb.y1, w: bb.w, h: bb.h };
      });
      setGraphState({ zoom: cy.zoom(), pan: cy.pan(), nodePositions: positions });
    };

    cy.on('drag pan zoom render', syncGraph);

    return () => cy.destroy();
  }, [isDarkMode, onNodeSelect]);

  return { containerRef, cyRef, graphState };
}
EOF

cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/useGraphTopology.ts
import { useCallback } from 'react';
import cytoscape from 'cytoscape';
import { CodebaseData, CodebaseFile, Dependency } from '@/services/codebase';

export function useGraphTopology(cyRef: React.RefObject<cytoscape.Core | null>) {
  const updateGraphTopology = useCallback((
    searchFilteredFiles: CodebaseFile[],
    visibleFiles: Record<string, boolean>,
    codebase: CodebaseData,
    impactedSet: Set<string>,
    currentLayout: string,
    folderPositions: Record<string, { label: string }>
  ) => {
    if (!cyRef.current) return;
    const cy = cyRef.current;

    cy.elements().remove();

    const filesByFolder: Record<string, CodebaseFile[]> = {};
    searchFilteredFiles.forEach(file => {
      const folderKey = file.path.split('/')[0] || 'other';
      if (!filesByFolder[folderKey]) filesByFolder[folderKey] = [];
      filesByFolder[folderKey].push(file);
    });

    const folderBaseX: Record<string, number> = { frontend: 40, backend: 460, config: 1270 };

    Object.keys(folderPositions).forEach(folderKey => {
      if ((filesByFolder[folderKey] || []).length > 0) {
        cy.add({ data: { id: `folder__${folderKey}`, label: folderPositions[folderKey].label }, classes: 'folder' });
      }
    });

    Object.entries(folderPositions).forEach(([folderKey]) => {
      const folderFiles = filesByFolder[folderKey] || [];
      const maxNodeWidth = folderKey === 'config' ? 320 : 288;
      const maxNodeHeight = folderKey === 'config' ? 240 : 280;

      folderFiles.forEach((file, index) => {
        const absX = folderBaseX[folderKey] + 30 + (index % 2) * (maxNodeWidth + 50) + maxNodeWidth / 2;
        const absY = 80 + Math.floor(index / 2) * (maxNodeHeight + 50) + maxNodeHeight / 2;
        cy.add({
          data: { id: file.id, parent: `folder__${folderKey}`, width: maxNodeWidth, height: maxNodeHeight },
          position: { x: absX, y: absY }
        });
      });
    });

    codebase.dependencies.forEach((dep: Dependency) => {
      if (visibleFiles[dep.sourceNode] && visibleFiles[dep.targetNode] &&
          searchFilteredFiles.some(f => f.id === dep.sourceNode) &&
          searchFilteredFiles.some(f => f.id === dep.targetNode)) {

        const isEdgeImpacted = impactedSet.has(dep.sourceHandle === 'header' ? dep.sourceNode : `${dep.sourceNode}__member__${dep.sourceHandle}`) &&
                               impactedSet.has(dep.targetHandle === 'header' ? dep.targetNode : `${dep.targetNode}__member__${dep.targetHandle}`);

        cy.add({
          data: { id: dep.id, source: dep.sourceNode, target: dep.targetNode, label: dep.label },
          classes: isEdgeImpacted ? 'impacted' : ''
        });
      }
    });

    cy.layout({ name: currentLayout === 'preset' ? 'grid' : currentLayout, animate: false }).run();
  }, [cyRef]);

  return { updateGraphTopology };
}
EOF

cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/use-graph.ts
import { useCytoscapeInstance } from './useCytoscapeInstance';
import { useGraphTopology } from './useGraphTopology';

export function useGraph(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const { containerRef, cyRef, graphState } = useCytoscapeInstance(isDarkMode, onNodeSelect);
  const { updateGraphTopology } = useGraphTopology(cyRef);

  return { containerRef, cyRef, graphState, updateGraphTopology };
}
EOF

# ----------------------------------------------------------------------------
# 9. OCP Node Style Registry (src/features/explorer/wksp-cnt-graph/components/graph/GraphUmlShapes.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/components/graph/GraphUmlShapes.tsx
import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { CodebaseFile, CodebaseAttribute, CodebaseMethod, ConfigProperty } from '@/services/codebase';

export interface NodeStyle {
  bg: string;
  border: string;
  badge: string;
  iconColor: string;
}

export const NODE_STYLE_REGISTRY: Record<string, NodeStyle> = {
  component: {
    bg: 'bg-emerald-600 dark:bg-emerald-900/80',
    border: 'border-emerald-500',
    badge: '🎨 React Component',
    iconColor: 'text-emerald-400'
  },
  interface: {
    bg: 'bg-indigo-700 dark:bg-indigo-950/80',
    border: 'border-indigo-500',
    badge: '⚙️ Java Interface',
    iconColor: 'text-indigo-400'
  },
  class: {
    bg: 'bg-blue-600 dark:bg-blue-950/80',
    border: 'border-blue-500',
    badge: '☕ Java Class',
    iconColor: 'text-blue-400'
  },
  default: {
    bg: 'bg-blue-600 dark:bg-blue-950/80',
    border: 'border-blue-500',
    badge: '☕ Java Class',
    iconColor: 'text-blue-400'
  }
};

export interface UmlClassNodeData extends CodebaseFile {
  isDimmed?: boolean;
  impactedMembers?: string[];
  selectedMember?: string;
  onSelectMember: (nodeId: string, memberId: string) => void;
}

export interface FolderNodeProps {
  data: { label: string };
  isSelected?: boolean;
}

export const FolderNode: React.FC<FolderNodeProps> = ({ isSelected }) => (
  <div className={`w-full h-full rounded-lg transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`} />
);

export const UmlClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;

  return (
    <div className={`w-72 bg-card rounded-lg shadow-xl border-2 ${style.border} relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
      <div className={`${style.bg} p-3 text-white relative rounded-t-[5px]`}>
        <div className="flex justify-between items-center">
          <span className="bg-black/30 opacity-85 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">{style.badge}</span>
          <span className="opacity-60 font-mono text-[10px]">{data.language}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileCode size={18} className={style.iconColor} />
          <h4 className="font-mono font-bold text-sm truncate">{data.name}</h4>
        </div>
      </div>
      <div className="bg-muted/30 p-2.5 border-border border-b">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Attributes</div>
        {(!data.attributes || data.attributes.length === 0) ? (
          <div className="text-muted-foreground text-xs italic">no attributes available</div>
        ) : (
          <ul className="space-y-0.5 font-mono text-[11px] text-foreground/80">
            {data.attributes.map((attr: CodebaseAttribute, idx: number) => (
              <li key={idx} className="flex items-center gap-1">
                <span className="text-muted-foreground">{attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}</span>
                {attr.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="p-2.5">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Methods / Exports</div>
        <div className="space-y-2">
          {data.methods?.map((m: CodebaseMethod) => {
            const isMethodImpacted = data.impactedMembers && data.impactedMembers.includes(m.id);
            const isSelected = data.selectedMember === m.id;
            return (
              <div key={m.id} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, m.id); }}
                className={`pointer-events-auto group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                  isSelected ? 'border-primary bg-primary/10' : isMethodImpacted ? 'border-orange-500 bg-orange-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => (
  <div className={`w-80 bg-card rounded-lg shadow-xl border-2 border-amber-500 relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
    <div className="flex justify-between items-center bg-amber-500 p-2.5 rounded-t-[5px] text-white">
      <div className="flex items-center gap-1.5">
        <Settings size={16} className="text-amber-100" />
        <h4 className="font-mono font-bold text-xs truncate">{data.name}</h4>
      </div>
      <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest">Configuration</span>
    </div>
    <div className="space-y-2 bg-black/90 p-3 max-h-64 overflow-y-auto font-mono text-[10px] text-slate-300">
      {data.configProperties?.map((prop: ConfigProperty) => {
        const isPropImpacted = data.impactedMembers && data.impactedMembers.includes(prop.key);
        const isSelected = data.selectedMember === prop.key;
        return (
          <div key={prop.key} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, prop.key); }}
            className={`pointer-events-auto group relative p-2 rounded border transition-all cursor-pointer ${
              isSelected ? 'border-primary bg-primary/20 text-white' : isPropImpacted ? 'border-orange-500 bg-orange-950/50 text-orange-400' : 'border-slate-800 hover:bg-slate-900'
            }`}
          >
            <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
            <div className="pl-2 text-slate-400 truncate">{prop.value}</div>
          </div>
        );
      })}
    </div>
  </div>
);
EOF

# ----------------------------------------------------------------------------
# 10. Clean Formatted Header Panel (src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export interface GraphPanelHeaderLeftProps {
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
}

export const GraphPanelHeaderLeft: React.FC<GraphPanelHeaderLeftProps> = ({ showGrid, setShowGrid }) => (
  <div className="flex items-center gap-2">
    <span>Topological Network</span>
    <Button
      variant="ghost"
      size="icon"
      className={`h-5 w-5 rounded transition-colors ${showGrid ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
      onClick={() => setShowGrid(!showGrid)}
    >
      <Grid size={12} />
    </Button>
  </div>
);

export interface GraphPanelHeaderCenterProps {
  maxNodesLimit: number;
  setMaxNodesLimit: (val: number) => void;
  callersDepth: number;
  setCallersDepth: (val: number) => void;
  calleesDepth: number;
  setCalleesDepth: (val: number) => void;
  displayLevel: string;
  setDisplayLevel: (val: string) => void;
  currentLayout: string;
  setCurrentLayout: (val: string) => void;
}

export const GraphPanelHeaderCenter: React.FC<GraphPanelHeaderCenterProps> = ({
  maxNodesLimit,
  setMaxNodesLimit,
  callersDepth,
  setCallersDepth,
  calleesDepth,
  setCalleesDepth,
  displayLevel,
  setDisplayLevel,
  currentLayout,
  setCurrentLayout
}) => (
  <div className="flex items-center gap-3">
    <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
      <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
      <Input
        type="number"
        min={1}
        max={100}
        className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center"
        value={maxNodesLimit}
        onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)}
      />
    </div>
    <Button className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider">
      <Database size={11} /> Neo4j
    </Button>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <User size={12} className="text-muted-foreground" />
      <Input
        type="number"
        min={0}
        max={20}
        className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
        value={callersDepth}
        onChange={(e) => setCallersDepth(Number(e.target.value) || 0)}
      />
    </div>
    <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm">
      <Baby size={12} className="text-muted-foreground" />
      <Input
        type="number"
        min={0}
        max={20}
        className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
        value={calleesDepth}
        onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)}
      />
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={displayLevel} onValueChange={setDisplayLevel}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-24 h-5 text-[11px] text-foreground">
          <SelectValue placeholder="Granularity" />
        </SelectTrigger>
        <SelectContent side="bottom">
          <SelectItem value="all">Show All</SelectItem>
          <SelectItem value="component">Component</SelectItem>
          <SelectItem value="class">Class</SelectItem>
          <SelectItem value="interface">Interface</SelectItem>
          <SelectItem value="module">Module</SelectItem>
          <SelectItem value="config">Configuration</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div className="flex items-center bg-background shadow-sm px-1 border border-border rounded h-6">
      <Select value={currentLayout} onValueChange={setCurrentLayout}>
        <SelectTrigger className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-28 h-5 text-[11px] text-foreground">
          <SelectValue placeholder="Layout Architecture" />
        </SelectTrigger>
        <SelectContent side="bottom">
          <SelectItem value="preset">Default (Packages)</SelectItem>
          <SelectItem value="grid">Grid Distribution</SelectItem>
          <SelectItem value="breadthfirst">Hierarchical (BFS)</SelectItem>
          <SelectItem value="cose">Force-Directed (Cose)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
);

export interface GraphPanelHeaderRightProps {
  cyRef: React.RefObject<any>;
  isGraphMaximized: boolean;
  setIsGraphMaximized: (maximized: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphPanelHeaderRightProps> = ({
  cyRef,
  isGraphMaximized,
  setIsGraphMaximized
}) => (
  <div className="flex items-center gap-1">
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) * 1.2)}
    >
      <Plus size={12} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => cyRef.current?.zoom((cyRef.current?.zoom() || 1) / 1.2)}
    >
      <Minus size={12} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => {
        cyRef.current?.fit();
        cyRef.current?.center();
      }}
    >
      <Focus size={12} />
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="w-5 h-5 text-muted-foreground"
      onClick={() => setIsGraphMaximized(!isGraphMaximized)}
    >
      {isGraphMaximized ? <Minimize size={12} /> : <Maximize size={12} />}
    </Button>
  </div>
);
EOF

# ----------------------------------------------------------------------------
# 11. CodebaseExplorerPanel (src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx
import React from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database } from 'lucide-react';
import { CodebaseFile, SelectedEntity, codebaseService } from '@/services/codebase';

interface CodebaseExplorerPanelProps {
  searchFilteredFiles: CodebaseFile[];
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFolderCheckbox: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
}

export function CodebaseExplorerPanel({
  searchFilteredFiles,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFolderCheckbox,
  toggleFileCheckbox,
  setSelectedEntity
}: CodebaseExplorerPanelProps) {
  const codebase = codebaseService.getCodebase();

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="bg-muted/20 p-4 border-border border-b">
        <h3 className="flex justify-between items-center mb-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
          <span>Codebase Explorer</span>
          <span className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">{searchFilteredFiles.length}/{codebase.files.length}</span>
        </h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        {['frontend', 'backend', 'config'].map(folder => (
          <div key={folder} className="mb-4">
            <div className="group flex justify-between items-center hover:bg-muted/50 px-1 py-1 rounded">
              <div className="flex items-center gap-1.5 cursor-pointer" onClick={() => toggleFolder(folder)}>
                {expandedFolders[folder] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <Folder size={15} className={folder === 'frontend' ? "fill-yellow-500/20 text-yellow-500" : folder === 'backend' ? "fill-indigo-500/20 text-indigo-500" : "fill-amber-500/20 text-amber-500"} />
                <span className="font-bold">{folder}/</span>
              </div>
              <input type="checkbox" checked={codebase.files.filter(f => f.path.startsWith(folder)).every(f => visibleFiles[f.id])} onChange={() => toggleFolderCheckbox(folder)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
            </div>
            {expandedFolders[folder] && (
              <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                {codebase.files.filter(f => f.path.startsWith(folder)).map((file: CodebaseFile) => (
                  <div key={file.id} className="group flex justify-between items-center hover:bg-muted px-2 py-1 rounded">
                    <span className={`flex items-center gap-1.5 truncate cursor-pointer ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`} onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}>
                      {folder === 'config' ? <Database size={13} className="text-amber-500" /> : <FileCode size={13} className={file.type === 'interface' ? 'text-indigo-400' : (folder === 'frontend' ? 'text-emerald-500' : 'text-blue-500')} />}
                      {file.name}
                    </span>
                    <input type="checkbox" checked={visibleFiles[file.id]} onChange={() => toggleFileCheckbox(file.id)} className="rounded w-3.5 h-3.5 text-primary cursor-pointer" />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 12. Inspector Tab Panel (src/features/explorer/wkp-rgt-tabs-inspector/inspector-tab-panel.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wkp-rgt-tabs-inspector/inspector-tab-panel.tsx
import React, { useMemo } from 'react';
import { FileCode, ShieldAlert, GitFork, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CodebaseData, CodebaseFile, SelectedEntity, ImpactDirection, CodebaseMethod, ConfigProperty } from '@/services/codebase';

interface InspectorTabPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  impactDirection: ImpactDirection;
  setImpactDirection: (dir: ImpactDirection) => void;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function InspectorTabPanel({
  selectedEntity,
  initialCodebase,
  impactDirection,
  setImpactDirection,
  impactedSet,
  handleCopy
}: InspectorTabPanelProps) {

  const generatedMarkdownRecipe = useMemo(() => {
    let md = `### 🛡️ Plan d'Impact & Fiche de Recette Polyglotte\n\n`;
    let startElement = 'Non défini';
    if (selectedEntity) {
      if (selectedEntity.type === 'member') startElement = `Méthode \`${selectedEntity.memberId}()\` de \`${selectedEntity.nodeId}\``;
      else startElement = `Fichier \`${selectedEntity.nodeId}\``;
    }
    md += `**Élément Déclencheur :** ${startElement}\n`;
    md += `**Direction de Propagation :** ${impactDirection === 'aval' ? 'Aval (Impacts descendants)' : 'Amont (Appelants ascendants)'}\n\n`;
    md += `#### 📋 Liste des composants à re-tester\n\n`;
    initialCodebase.files.forEach((file: CodebaseFile) => {
      if (impactedSet.has(file.id)) { md += `- [ ] **${file.name}** (\`${file.path}\`)\n`; }
    });
    return md;
  }, [selectedEntity, impactDirection, impactedSet, initialCodebase]);

  if (!selectedEntity) {
    return (
      <div className="py-12 text-muted-foreground text-center">
        <ShieldAlert size={36} className="opacity-40 mx-auto mb-2 text-muted-foreground" />
        <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
        <p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">Click any file component link row or surgical grid handle item to initialize graph mapping parameters.</p>
      </div>
    );
  }

  const currentFile = initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId);
  if (!currentFile) return null;

  return (
    <div className="space-y-4 animate-in duration-200 fade-in">
      {/* Active Element Properties Block */}
      <div className="space-y-3 bg-primary/5 p-4 border border-primary/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-[10px] text-primary uppercase tracking-wider">ACTIVE SUBSYSTEM</span>
          <span className="bg-primary/10 px-2.5 py-0.5 rounded font-mono font-bold text-primary text-xs">{currentFile.language}</span>
        </div>
        <div className="flex items-start gap-2.5 mt-3">
          <FileCode size={20} className="mt-1 text-primary shrink-0" />
          <div className="overflow-hidden">
            <h4 className="font-mono font-bold text-foreground text-sm truncate">
              {selectedEntity.type === 'member' ? `${currentFile.name} ➔ ${selectedEntity.memberId}()` : currentFile.name}
            </h4>
            <span className="block mt-0.5 font-mono text-[10px] text-muted-foreground truncate">{currentFile.path}</span>
          </div>
        </div>
        <div className="gap-3 grid grid-cols-2 pt-3 border-border border-t">
          <div className="bg-background p-2 border border-border rounded">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">Volume of Code</span>
            <span className="font-mono font-bold text-foreground text-xs">{currentFile.size} LOC</span>
          </div>
          <div className="bg-background p-2 border border-border rounded">
            <span className="block font-mono text-[10px] text-muted-foreground uppercase">Complexity V(g)</span>
            <span className="font-mono font-bold text-foreground text-xs">Level {currentFile.complexity}</span>
          </div>
        </div>
        <div className="bg-slate-950 mt-3 p-2.5 border border-slate-800 rounded font-mono text-slate-300 text-xs">
          <div className="mb-1 font-bold text-[10px] text-amber-400 uppercase">Functional Documentation:</div>
          {selectedEntity.type === 'member' ? (
            currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId)?.description ||
            currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId)?.value ||
            "No dedicated structural descriptions mapped for this member item node."
          ) : (
            `File container encapsulating target polyglot implementation layers at specified location pathing.`
          )}
        </div>
      </div>

      {/* Impact Direction Controls */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-2 grid grid-cols-2">
          <Button onClick={() => setImpactDirection('aval')} className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 ${impactDirection === 'aval' ? 'bg-orange-500 border-orange-400 text-white shadow-md' : 'bg-muted border-border text-foreground'}`}><GitFork size={13} className="rotate-180" />Downstream</Button>
          <Button onClick={() => setImpactDirection('amont')} className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 ${impactDirection === 'amont' ? 'bg-orange-500 border-orange-400 text-white shadow-md' : 'bg-muted border-border text-foreground'}`}><GitFork size={13} />Upstream</Button>
        </div>
      </div>

      {/* Fluorescent Impact Plan */}
      <div className="space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5"><ShieldAlert size={14} className="text-orange-500" /><h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5></div>
          <Button onClick={() => handleCopy(generatedMarkdownRecipe, "Markdown impact recipe copied to clip-board!")} className="flex items-center gap-1 bg-muted hover:bg-muted/80 px-2 py-1 border border-border rounded h-6 font-mono text-[10px] text-foreground">
            <Copy size={10} />Copy Recipes
          </Button>
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {initialCodebase.files.map((f: CodebaseFile) => impactedSet.has(f.id) ? (
            <div key={f.id} className="flex justify-between items-center bg-background px-2 py-1.5 border border-orange-500/20 rounded font-mono text-[11px]"><span className="font-semibold text-foreground truncate">{f.name}</span><span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">{f.language}</span></div>
          ) : null)}
        </div>
      </div>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 13. GlobalInspectorPanel (src/features/explorer/wkp-rgt-tabs-inspector/global-inspector-panel.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wkp-rgt-tabs-inspector/global-inspector-panel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InspectorTabPanel } from './inspector-tab-panel';
import { PlantUmlTabPanel } from './plantuml-tab-panel';
import { JsonTabPanel } from './json-tab-panel';
import { CodebaseData, SelectedEntity, ImpactDirection } from '@/services/codebase';

interface GlobalInspectorPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  impactDirection: ImpactDirection;
  setImpactDirection: (dir: ImpactDirection) => void;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
  generatedPlantUML: string;
}

export function GlobalInspectorPanel({
  selectedEntity,
  initialCodebase,
  impactDirection,
  setImpactDirection,
  impactedSet,
  handleCopy,
  generatedPlantUML
}: GlobalInspectorPanelProps) {
  const [rightPanelTab, setRightPanelTab] = useState<'inspect' | 'plantuml' | 'json_schema'>('inspect');

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b shrink-0">
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('inspect')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Inspector
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('plantuml')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'plantuml' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          PlantUML
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('json_schema')}
          className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'json_schema' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          JSON Schema
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {rightPanelTab === 'inspect' && (
          <InspectorTabPanel
            selectedEntity={selectedEntity}
            initialCodebase={initialCodebase}
            impactDirection={impactDirection}
            setImpactDirection={setImpactDirection}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'plantuml' && (
          <PlantUmlTabPanel
            generatedPlantUML={generatedPlantUML}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'json_schema' && (
          <JsonTabPanel handleCopy={handleCopy} />
        )}
      </div>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 14. Extensible View Registry in App.tsx (src/App.tsx)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/App.tsx
import React, { useState, useEffect } from 'react';
import { ExplorerFeature } from './features/explorer/ExplorerFeature';
import { WelcomeFeature } from './features/welcome/WelcomeFeature';
import { RulesFeature } from './features/rules/RulesFeature';
import { HelpFeature } from './features/help/HelpFeature';
import { FallbackFeature } from './features/fallback/FallbackFeature';

// OCP Strategy View Registry Map for extensible view routing
const VIEW_REGISTRY: Record<string, React.ComponentType<any>> = {
  'panel-explorer': ExplorerFeature,
  'panel-welcome': WelcomeFeature,
  'panel-rules': RulesFeature,
  'panel-help': HelpFeature,
};

export default function App() {
  const [activeView, setActiveView] = useState('panel-explorer');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const htmlElement = document.documentElement;
    if (isDarkMode) htmlElement.classList.add('dark');
    else htmlElement.classList.remove('dark');
  }, [isDarkMode]);

  const commonProps = {
    activeView,
    setActiveView,
    isDarkMode,
    setIsDarkMode,
    isLocked,
    setIsLocked
  };

  const ActiveComponent = VIEW_REGISTRY[activeView] || FallbackFeature;

  return <ActiveComponent {...commonProps} />;
}
EOF

# ----------------------------------------------------------------------------
# 15. Verify Build Integrity
# ----------------------------------------------------------------------------
npm run build
echo "✅ refactor: Plan execution 100% completed! All SOLID principles, Hexagonal Service Layer, layout modularization, and strict TypeScript contracts applied successfully."

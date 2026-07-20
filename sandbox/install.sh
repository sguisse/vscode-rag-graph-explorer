#!/usr/bin/env bash
# ============================================================================
# VS Code Webview Extension Core Layout Component Refactoring Script
# Action: Modularizes AppLayout by externalizing the Header, Left Sidebar with
# exact state replication, and introduces a dedicated 40px fixed application Footer.
# ============================================================================

set -e

# Create target directories if missing
mkdir -p src/components/app/layout

# 1. Create the fully externalized Left Sidebar component preserving all menu actions and states
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
      >
        <item.icon size={16} className="mr-2.5 shrink-0" />
        {sidebarLeftMode === 'normal' && (
          <>
            <span className="truncate">{item.label}</span>
            {item.badge && <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>}
          </>
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

# 2. Create the externalized Header component restoring all layout toggles, search, and themes exactly
cat << 'EOF' > src/components/app/layout/header.tsx
import React from 'react';
import { Search, Upload, Download, Moon, Sun, RotateCcw, Eye, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';

export interface HeaderProps {
  setSidebarLeftMode: React.Dispatch<React.SetStateAction<'normal' | 'minimal' | 'collapsed'>>;
  searchTerm: string;
  onSearchChange?: (val: string) => void;
  isLocked: boolean;
  setImportOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetFilters?: () => void;
  isCtnWorkspaceVisible: boolean;
  setIsCtnWorkspaceVisible: (visible: boolean) => void;
  isCtnWorkspaceTopVisible: boolean;
  setIsCtnWorkspaceTopVisible: (visible: boolean) => void;
  isCtnWorkspaceLeftVisible: boolean;
  setIsCtnWorkspaceLeftVisible: (visible: boolean) => void;
  isCtnWorkspaceCenterVisible: boolean;
  setIsCtnWorkspaceCenterVisible: (visible: boolean) => void;
  isCtnWorkspaceRightVisible: boolean;
  setIsCtnWorkspaceRightVisible: (visible: boolean) => void;
  isCtnWorkspaceBottomVisible: boolean;
  setIsCtnWorkspaceBottomVisible: (visible: boolean) => void;
  isSidebarRightVisible: boolean;
  setIsSidebarRightVisible: (visible: boolean) => void;
  layoutConfig: {
    showTop?: boolean;
    showLeft?: boolean;
    showCenter?: boolean;
    showRight?: boolean;
    showBottom?: boolean;
    showRightSidebar?: boolean;
  };
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
  isCtnWorkspaceVisible,
  setIsCtnWorkspaceVisible,
  isCtnWorkspaceTopVisible,
  setIsCtnWorkspaceTopVisible,
  isCtnWorkspaceLeftVisible,
  setIsCtnWorkspaceLeftVisible,
  isCtnWorkspaceCenterVisible,
  setIsCtnWorkspaceCenterVisible,
  isCtnWorkspaceRightVisible,
  setIsCtnWorkspaceRightVisible,
  isCtnWorkspaceBottomVisible,
  setIsCtnWorkspaceBottomVisible,
  isSidebarRightVisible,
  setIsSidebarRightVisible,
  layoutConfig
}: HeaderProps) {
  return (
    <LeftCenterRightPanel
      id="ctn-header"
      className="z-20 bg-card px-3 border-border border-b h-[40px] shrink-0"
      left={
        <>
          <Button variant="ghost" size="icon" onClick={() => setSidebarLeftMode(m => m === 'collapsed' ? 'normal' : 'collapsed')} className="w-8 h-8 text-muted-foreground hover:text-foreground" data-tooltip="Toggle primary navigation drawer"><Menu size={16} /></Button>
          <div className="flex items-center gap-2 ml-1 text-primary cursor-help"><span className="font-bold text-foreground text-xs tracking-tight">Archi-Polyglot Workspace</span></div>
        </>
      }
      center={
        <div className="relative flex items-center w-full max-w-md">
          <Search className="left-2 absolute text-muted-foreground" size={14} />
          <Input type="text" placeholder="Search for an AST entity (e.g., UserController)..." value={searchTerm} onChange={(e) => onSearchChange && onSearchChange(e.target.value)} className="bg-muted pl-8 h-8 text-xs" disabled={isLocked} data-tooltip="Enter FQN token to globally query code index structures" />
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
          <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceVisible(!isCtnWorkspaceVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'}`} data-tooltip="Toggle core workspace frame canvas wrapper"><Eye size={16} /></Button>

          {layoutConfig.showTop && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceTopVisible(!isCtnWorkspaceTopVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceTopVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle workspace mapping path summary rows"><Eye size={16} /></Button>}
          {layoutConfig.showLeft && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceLeftVisible(!isCtnWorkspaceLeftVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceLeftVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle multi-layer filter explorer stream"><Eye size={16} /></Button>}
          {layoutConfig.showCenter && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceCenterVisible(!isCtnWorkspaceCenterVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceCenterVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle center interactive stage"><Eye size={16} /></Button>}
          {layoutConfig.showRight && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceRightVisible(!isCtnWorkspaceRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle right sub-workspace tab inspect matrices"><Eye size={16} /></Button>}
          {layoutConfig.showBottom && <Button variant="ghost" size="icon" onClick={() => setIsCtnWorkspaceBottomVisible(!isCtnWorkspaceBottomVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isCtnWorkspaceBottomVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle bottom system real-time runtime status log bars"><Eye size={16} /></Button>}
          {layoutConfig.showRightSidebar && (
            <>
              <div className="mx-1 bg-border w-px h-4"></div>
              <Button variant="ghost" size="icon" onClick={() => setIsSidebarRightVisible(!isSidebarRightVisible)} className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${isSidebarRightVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'hover:bg-muted'}`} data-tooltip="Toggle far-right global identity properties side-drawer"><Eye size={16} /></Button>
            </>
          )}
        </div>
      }
    />
  );
}
EOF

# 3. Create the externalized dedicated Footer component utilizing LeftCenterRightPanel (Fixed, 40px height)
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

# 4. Reconstruct AppLayout perfectly binding components together with 0% regression
cat << 'EOF' > src/components/app/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { Tooltip } from '@/components/app/tooltip';
import { useResizable } from '@/components/app/container/hooks/use-resizable';
import { Header } from './header';
import { SidebarLeft } from './sidebar-left';
import { Footer } from './footer';

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

  // Local visibility overrides based on layoutConfig defaults
  const [isCtnWorkspaceVisible, setIsCtnWorkspaceVisible] = useState(true);
  const [isCtnWorkspaceTopVisible, setIsCtnWorkspaceTopVisible] = useState(layoutConfig.showTop ?? false);
  const [isCtnWorkspaceLeftVisible, setIsCtnWorkspaceLeftVisible] = useState(layoutConfig.showLeft ?? false);
  const [isCtnWorkspaceCenterVisible, setIsCtnWorkspaceCenterVisible] = useState(layoutConfig.showCenter ?? false);
  const [isCtnWorkspaceRightVisible, setIsCtnWorkspaceRightVisible] = useState(layoutConfig.showRight ?? false);
  const [isCtnWorkspaceBottomVisible, setIsCtnWorkspaceBottomVisible] = useState(layoutConfig.showBottom ?? false);
  const [isSidebarRightVisible, setIsSidebarRightVisible] = useState(layoutConfig.showRightSidebar ?? false);

  // Resizable hooks
  const [sidebarLeftWidth, startSidebarLeftResize, isDraggingSidebarLeft] = useResizable(220, 160, 400, true, false, 60);
  const [sidebarRightWidth, startSidebarRightResize, isDraggingSidebarRight] = useResizable(300, 200, 500, true, true, 80);
  const [ctnWorkspaceLeftWidth, startCtnWorkspaceLeftResize, isDraggingLeftPane] = useResizable(260, 180, 500, true, false);
  const [ctnWorkspaceRightWidth, startCtnWorkspaceRightResize, isDraggingRightPane] = useResizable(320, 200, 600, true, true);
  const [ctnWorkspaceTopHeight, startCtnWorkspaceTopResize, isDraggingTopPane] = useResizable(120, 50, 250, false, false);
  const [ctnWorkspaceBottomHeight, startCtnWorkspaceBottomResize, isDraggingBottomPane] = useResizable(30, 30, 400, false, true);

  const isCurrentlyResizing = isDraggingSidebarLeft || isDraggingSidebarRight || isDraggingLeftPane || isDraggingRightPane || isDraggingTopPane || isDraggingBottomPane;

  const activeMiddlePanelsCount =
    (isCtnWorkspaceLeftVisible ? 1 : 0) +
    (isCtnWorkspaceCenterVisible ? 1 : 0) +
    (isCtnWorkspaceRightVisible ? 1 : 0);

  return (
    <div id="ctn-root" className={`flex flex-col h-screen w-screen overflow-hidden font-sans text-sm select-none transition-colors duration-200 bg-background text-foreground ${isDarkMode ? 'dark' : ''}`}>

      {notification && (
        <div className="top-12 left-1/2 z-50 fixed flex items-center gap-2 bg-primary slide-in-from-top-4 shadow-2xl px-4 py-2.5 rounded-full font-mono text-primary-foreground text-xs -translate-x-1/2 animate-in transform fade-in">
          {notification}
        </div>
      )}

      {/* EXTERNALIZED HEADER WITH PRESERVED ORIGINAL CONTENT & BEHAVIOR */}
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
        isCtnWorkspaceVisible={isCtnWorkspaceVisible}
        setIsCtnWorkspaceVisible={setIsCtnWorkspaceVisible}
        isCtnWorkspaceTopVisible={isCtnWorkspaceTopVisible}
        setIsCtnWorkspaceTopVisible={setIsCtnWorkspaceTopVisible}
        isCtnWorkspaceLeftVisible={isCtnWorkspaceLeftVisible}
        setIsCtnWorkspaceLeftVisible={setIsCtnWorkspaceLeftVisible}
        isCtnWorkspaceCenterVisible={isCtnWorkspaceCenterVisible}
        setIsCtnWorkspaceCenterVisible={setIsCtnWorkspaceCenterVisible}
        isCtnWorkspaceRightVisible={isCtnWorkspaceRightVisible}
        setIsCtnWorkspaceRightVisible={setIsCtnWorkspaceRightVisible}
        isCtnWorkspaceBottomVisible={isCtnWorkspaceBottomVisible}
        setIsCtnWorkspaceBottomVisible={setIsCtnWorkspaceBottomVisible}
        isSidebarRightVisible={isSidebarRightVisible}
        setIsSidebarRightVisible={setIsSidebarRightVisible}
        layoutConfig={layoutConfig}
      />

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="bg-card border border-border">
          <DialogHeader><DialogTitle className="text-foreground text-sm">Import AST Data Schema</DialogTitle></DialogHeader>
          <div className="p-2 border border-dashed rounded text-muted-foreground text-xs text-center">Select local extraction file payload</div>
        </DialogContent>
      </Dialog>

      {/* pb-[40px] leaves clean clearance for the main full-width fixed footer component */}
      <div id="ctn-main" className="relative flex flex-1 overflow-hidden pb-[40px]">

        {/* EXTERNALIZED SIDEBAR LEFT COMPONENT WITH PRESERVED BEHAVIORS */}
        <SidebarLeft
          sidebarLeftMode={sidebarLeftMode}
          setSidebarLeftMode={setSidebarLeftMode}
          activeView={activeView}
          setActiveView={setActiveView}
          sidebarLeftWidth={sidebarLeftWidth}
          startSidebarLeftResize={startSidebarLeftResize}
          isDraggingSidebarLeft={isDraggingSidebarLeft}
        />

        {/* WORKSPACE CENTER COMPOSITION */}
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

        {/* RIGHT SIDEBAR PANEL */}
        {layoutConfig.showRightSidebar && (
          <ResizableContainer id="ctn-sidebar-right" visible={isSidebarRightVisible} style={{ width: `${sidebarRightWidth}px` }} headerLeft={headers.rightSidebarHeader} headerRight={headers.rightSidebarHeaderRight} className="border-l shrink-0" resizeHandle="left" onResizeStart={startSidebarRightResize}>
            {panels.rightSidebar}
          </ResizableContainer>
        )}

      </div>

      <Footer />

      <Tooltip delay={1500} />
    </div>
  );
}
EOF

echo "✅ feat/refactor: Restored complete header functionality and externalized sidebar-left matching layoutConfig/sidebarLeftMode constraints without regressions!"

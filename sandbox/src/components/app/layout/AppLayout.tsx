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

  const { visibility, actions } = useLayoutState(layoutConfig);

  const [sidebarLeftWidth, startSidebarLeftResize, isDraggingSidebarLeft] = useResizable(220, 190, 400, true, false, 60);
  const [sidebarRightWidth, startSidebarRightResize, isDraggingSidebarRight] = useResizable(300, 50, 500, true, true, 80);
  const [ctnWorkspaceLeftWidth, startCtnWorkspaceLeftResize, isDraggingLeftPane] = useResizable(260, 50, 500, true, false);
  const [ctnWorkspaceRightWidth, startCtnWorkspaceRightResize, isDraggingRightPane] = useResizable(320, 50, 600, true, true);
  const [ctnWorkspaceTopHeight, startCtnWorkspaceTopResize, isDraggingTopPane] = useResizable(120, 75, 250, false, false);
  const [ctnWorkspaceBottomHeight, startCtnWorkspaceBottomResize, isDraggingBottomPane] = useResizable(33, 33, 400, false, true);

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

      <div id="ctn-main" className="relative flex flex-1 pb-[40px] overflow-hidden">

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

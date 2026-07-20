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

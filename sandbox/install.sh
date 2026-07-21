#!/usr/bin/env bash
# ============================================================================
# Complete Layout State & Tri-State Checkbox Integration Script
# Action:
#   1. Reloads exact state from latest attachment source export.
#   2. Adds panel close cross buttons (X icon) to workspace title bars
#      (ctn-workspace-top, ctn-workspace-left, ctn-workspace-right, ctn-workspace-bottom)
#      EXCEPT ctn-workspace-center.
#   3. Integrates close cross button in rightSidebarHeaderRight to hide right sidebar via use-layout-state.
#   4. Re-applies Tri-State Checkbox component on the left side of folders in CodebaseExplorerPanel.
#   5. Verifies 100% build integrity with Vite production compiler.
# ============================================================================

set -e

# Ensure layout subdirectories exist
mkdir -p src/components/app/layout/hooks
mkdir -p src/features/explorer/wkp-lft-codebase-tree

# ----------------------------------------------------------------------------
# 1. LAYOUT STATE HOOK (src/components/app/layout/hooks/use-layout-state.ts)
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
# 2. WORKSPACE COMPONENT (CLOSE BUTTONS ADDED TO ALL PANELS EXCEPT CENTER)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/workspace.tsx
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { LayoutVisibilityActions } from './hooks/use-layout-state';

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
  actions: LayoutVisibilityActions;
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
  actions
}: WorkspaceProps) {
  return (
    <div id="ctn-workspace" style={{ display: isCtnWorkspaceVisible ? 'flex' : 'none' }} className="relative flex flex-1 bg-background min-w-0">
      <div className="relative flex flex-col flex-1 min-w-0">

        {/* TOP PANEL */}
        {layoutConfig.showTop && (
          <ResizableContainer
            id="ctn-workspace-top"
            visible={isCtnWorkspaceTopVisible}
            style={{ height: `${ctnWorkspaceTopHeight}px` }}
            headerLeft="Target Path Mapping Streams"
            headerRight={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => actions.setIsCtnWorkspaceTopVisible(false)}
                className="w-5 h-5 text-muted-foreground hover:text-foreground p-0 rounded cursor-pointer"
                data-tooltip="Close top panel"
              >
                <X size={12} />
              </Button>
            }
            resizeHandle="bottom"
            onResizeStart={startCtnWorkspaceTopResize}
            className="bg-muted border-b"
          >
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
              headerRight={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => actions.setIsCtnWorkspaceLeftVisible(false)}
                  className="w-5 h-5 text-muted-foreground hover:text-foreground p-0 rounded cursor-pointer"
                  data-tooltip="Close left panel"
                >
                  <X size={12} />
                </Button>
              }
              className={activeMiddlePanelsCount === 1 ? "min-w-[200px]" : "border-r min-w-[200px]"}
              resizeHandle={activeMiddlePanelsCount > 1 ? "right" : "none"}
              onResizeStart={startCtnWorkspaceLeftResize}
            >
              {panels.left}
            </ResizableContainer>
          )}

          {/* CENTER PANEL (EXCEPTED FROM CLOSE CROSS BUTTON) */}
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
              headerRight={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => actions.setIsCtnWorkspaceRightVisible(false)}
                  className="w-5 h-5 text-muted-foreground hover:text-foreground p-0 rounded cursor-pointer"
                  data-tooltip="Close right inspector panel"
                >
                  <X size={12} />
                </Button>
              }
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
          <ResizableContainer
            id="ctn-workspace-bottom"
            visible={isCtnWorkspaceBottomVisible}
            style={{ height: `${ctnWorkspaceBottomHeight}px` }}
            headerLeft="AST Pipeline Monitoring Feed"
            headerRight={
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => actions.setIsCtnWorkspaceBottomVisible(false)}
                className="w-5 h-5 text-muted-foreground hover:text-foreground p-0 rounded cursor-pointer"
                data-tooltip="Close bottom panel"
              >
                <X size={12} />
              </Button>
            }
            className="bg-secondary border-t"
            resizeHandle="top"
            onResizeStart={startCtnWorkspaceBottomResize}
          >
            {panels.bottom}
          </ResizableContainer>
        )}
      </div>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 3. SIDEBAR RIGHT (CLOSE CROSS BUTTON INTEGRATED WITH USE-LAYOUT-STATE)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/components/app/layout/sidebar-right.tsx
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResizableContainer } from '@/components/app/container/resizable-container';
import { LayoutVisibilityActions } from './hooks/use-layout-state';

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
  actions: LayoutVisibilityActions;
}

export function SidebarRight({
  layoutConfig,
  isSidebarRightVisible,
  sidebarRightWidth,
  headers,
  panels,
  startSidebarRightResize,
  actions
}: SidebarRightProps) {
  if (!layoutConfig.showRightSidebar) return null;

  return (
    <ResizableContainer
      id="ctn-sidebar-right"
      visible={isSidebarRightVisible}
      style={{ width: `${sidebarRightWidth}px` }}
      headerLeft={headers.rightSidebarHeader}
      headerRight={
        <div className="flex items-center gap-1">
          {headers.rightSidebarHeaderRight}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => actions.setIsSidebarRightVisible(false)}
            className="w-5 h-5 text-muted-foreground hover:text-foreground p-0 rounded cursor-pointer"
            data-tooltip="Hide entity properties drawer"
          >
            <X size={12} />
          </Button>
        </div>
      }
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
# 4. AppLayout COMPONENT PASSING ACTIONS TO WORKSPACE AND SIDEBAR RIGHT
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

  const { visibility, actions } = useLayoutState(layoutConfig);

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
          actions={actions}
        />

        <SidebarRight
          layoutConfig={layoutConfig}
          isSidebarRightVisible={visibility.isSidebarRightVisible}
          sidebarRightWidth={sidebarRightWidth}
          headers={headers}
          panels={panels}
          startSidebarRightResize={startSidebarRightResize}
          actions={actions}
        />

      </div>

      <Footer />

      <Tooltip delay={1500} />
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 5. EXPLORER FEATURE CLEANUP (CLEAR SELECTION DISMISS ACTION IN HEADER)
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { codebaseService, SelectedEntity, ImpactDirection } from '@/services/codebase';

import { EntityPropertiesPanel } from './sdb-rgt-properties/EntityPropertiesPanel';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphPanelHeaderLeft, GraphPanelHeaderCenter, GraphPanelHeaderRight } from './wksp-cnt-graph/GraphPanelHeader';
import { useGraph } from './wksp-cnt-graph/components/graph/use-graph';
import { usePlantUml } from './wksp-cnt-graph/components/graph/use-plantuml';
import { useCopyToClipboard } from '@/hooks/use-clipboard';

import { GlobalInspectorPanel } from './wkp-rgt-tabs-inspector/global-inspector-panel';
import { GraphPanel } from './wksp-cnt-graph/GraphPanel';
import { ContextPathsPanel } from './wkp-top-paths/context-paths-panel';
import { WkpBottomPanel } from './wkp-btm-infos/wkp-bottom-panel';

import { useTransitiveImpact } from './hooks/use-transitive-impact';
import { useCodebaseFilter } from './hooks/use-codebase-filter';

export function ExplorerFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  const codebaseData = codebaseService.getCodebase();
  const folderPositions = codebaseService.getFolderPositions();

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>({ type: 'node', nodeId: 'OrderController.java' });
  const [impactDirection, setImpactDirection] = useState<ImpactDirection>('aval');
  const [notification, setNotification] = useState<string | null>(null);

  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(0);
  const [currentLayout, setCurrentLayout] = useState('preset');
  const [showGrid, setShowGrid] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);

  const { copy } = useCopyToClipboard();

  const {
    searchTerm,
    setSearchTerm,
    displayLevel,
    setDisplayLevel,
    maxNodesLimit,
    setMaxNodesLimit,
    expandedFolders,
    visibleFiles,
    toggleFolder,
    toggleFolderCheckbox,
    toggleFileCheckbox,
    searchFilteredFiles,
    resetFilters
  } = useCodebaseFilter(codebaseData.files);

  const { impactedSet } = useTransitiveImpact(selectedEntity, impactDirection, codebaseData.dependencies);

  const handleCopy = useCallback((text: string, message: string) => {
    copy(text, () => {
      setNotification(message);
      setTimeout(() => setNotification(null), 3000);
    });
  }, [copy]);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const handleSelectMember = useCallback((nodeId: string, memberId: string) => {
    setSelectedEntity({ type: 'member', nodeId, memberId });
  }, []);

  const { containerRef, cyRef, graphState, updateGraphTopology } = useGraph(props.isDarkMode, handleNodeSelect);

  const generatedPlantUML = usePlantUml(searchFilteredFiles, visibleFiles, codebaseData.dependencies);

  useEffect(() => {
    updateGraphTopology(searchFilteredFiles, visibleFiles, codebaseData, impactedSet, currentLayout, folderPositions);
  }, [searchFilteredFiles, visibleFiles, codebaseData, impactedSet, currentLayout, folderPositions, updateGraphTopology]);

  const applyLayout = useCallback((layout: string) => {
    setCurrentLayout(layout);
  }, []);

  const handleReset = useCallback(() => {
    resetFilters();
    setSelectedEntity(null);
  }, [resetFilters]);

  return (
    <AppLayout
      {...props}
      isGraphMaximized={isGraphMaximized}
      layoutConfig={{ showTop: true, showLeft: true, showCenter: true, showRight: true, showBottom: true, showRightSidebar: true }}
      notification={notification}
      panels={{
        left: (
          <CodebaseExplorerPanel
            searchFilteredFiles={searchFilteredFiles}
            expandedFolders={expandedFolders}
            visibleFiles={visibleFiles}
            toggleFolder={toggleFolder}
            toggleFolderCheckbox={toggleFolderCheckbox}
            toggleFileCheckbox={toggleFileCheckbox}
            setSelectedEntity={setSelectedEntity}
          />
        ),
        center: (
          <GraphPanel
            containerRef={containerRef}
            showGrid={showGrid}
            isDarkMode={props.isDarkMode}
            graphState={graphState}
            selectedEntity={selectedEntity}
            searchFilteredFiles={searchFilteredFiles}
            impactedSet={impactedSet}
            handleSelectMember={handleSelectMember}
          />
        ),
        right: (
          <GlobalInspectorPanel
            selectedEntity={selectedEntity}
            initialCodebase={codebaseData}
            impactDirection={impactDirection}
            setImpactDirection={setImpactDirection}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
            generatedPlantUML={generatedPlantUML}
          />
        ),
        top: <ContextPathsPanel />,
        bottom: <WkpBottomPanel />,
        rightSidebar: <EntityPropertiesPanel selectedEntity={selectedEntity} />
      }}
      headers={{
        leftPanelTitle: "AST Explorer",
        centerPanelHeader: <GraphPanelHeaderLeft showGrid={showGrid} setShowGrid={setShowGrid} />,
        centerPanelHeaderCenter: (
          <GraphPanelHeaderCenter
            maxNodesLimit={maxNodesLimit}
            setMaxNodesLimit={setMaxNodesLimit}
            callersDepth={callersDepth}
            setCallersDepth={setCallersDepth}
            calleesDepth={calleesDepth}
            setCalleesDepth={setCalleesDepth}
            displayLevel={displayLevel}
            setDisplayLevel={setDisplayLevel}
            currentLayout={currentLayout}
            setCurrentLayout={applyLayout}
          />
        ),
        centerPanelHeaderRight: <GraphPanelHeaderRight cyRef={cyRef} isGraphMaximized={isGraphMaximized} setIsGraphMaximized={setIsGraphMaximized} />,
        rightSidebarHeader: <><Layers size={13} className="mr-1.5"/> <span>Entity Properties</span></>
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onResetFilters={handleReset}
    />
  );
}
EOF

# ----------------------------------------------------------------------------
# 6. CODEBASE EXPLORER PANEL WITH TRI-STATE CHECKBOX ON THE LEFT
# ----------------------------------------------------------------------------
cat << 'EOF' > src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx
import React, { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database } from 'lucide-react';
import {
  CodebaseFile,
  SelectedEntity,
  codebaseService,
  FOLDER_KEYS_REGISTERED_CONFIG,
  FOLDER_THEME_REGISTRY_CONFIG
} from '@/services/codebase';

interface TriStateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
  );
}

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
        {FOLDER_KEYS_REGISTERED_CONFIG.map(folder => {
          const theme = FOLDER_THEME_REGISTRY_CONFIG[folder] || FOLDER_THEME_REGISTRY_CONFIG.default;
          const folderFiles = codebase.files.filter(f => f.path.startsWith(folder));
          const isAllChecked = folderFiles.length > 0 && folderFiles.every(f => visibleFiles[f.id]);
          const isSomeChecked = folderFiles.some(f => visibleFiles[f.id]);
          const isIndeterminate = isSomeChecked && !isAllChecked;

          return (
            <div key={folder} className="mb-4">
              <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                <TriStateCheckbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={() => toggleFolderCheckbox(folder)}
                  className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                />
                <div className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => toggleFolder(folder)}>
                  {expandedFolders[folder] ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  <Folder size={15} className={`${theme.fill} ${theme.text} shrink-0`} />
                  <span className="font-bold truncate">{folder}/</span>
                </div>
              </div>
              {expandedFolders[folder] && (
                <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                  {folderFiles.map((file: CodebaseFile) => (
                    <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={!!visibleFiles[file.id]}
                        onChange={() => toggleFileCheckbox(file.id)}
                        className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                      />
                      <span
                        className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`}
                        onClick={() => setSelectedEntity({ type: 'node', nodeId: file.id })}
                      >
                        {folder === 'config' ? (
                          <Database size={13} className="text-amber-500 shrink-0" />
                        ) : (
                          <FileCode size={13} className={file.type === 'interface' ? 'text-indigo-400 shrink-0' : (folder === 'frontend' ? 'text-emerald-500 shrink-0' : 'text-blue-500 shrink-0')} />
                        )}
                        <span className="truncate">{file.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
EOF

# ----------------------------------------------------------------------------
# 7. VERIFY PRODUCTION VITE BUILD
# ----------------------------------------------------------------------------
npm run build

echo "=========================================================================="
echo "✅ feat/ui: Reloaded latest source & applied panel close cross buttons to"
echo "   all workspace panels (except center) and rightSidebar linked to use-layout-state!"
echo "=========================================================================="

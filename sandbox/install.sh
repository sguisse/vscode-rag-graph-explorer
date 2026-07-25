#!/usr/bin/env bash
set -e

echo "🚀 Refactoring ExplorerFeature.tsx to define layout containers explicitly like WelcomeFeature.tsx..."

mkdir -p src/features/explorer

cat << 'EOF' > src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';

import { ContextPathsPanel } from './wkp-top-paths/context-paths-panel';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphPanel } from './wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from './wksp-cnt-graph/GraphPanelHeader';
import { GlobalInspectorPanel } from './wkp-rgt-tabs-inspector/global-inspector-panel';
import { WkpBottomPanel } from './wkp-btm-infos/wkp-bottom-panel';
import { EntityPropertiesPanel } from './sdb-rgt-properties/EntityPropertiesPanel';

import { useCodebaseFilter } from './hooks/use-codebase-filter';
import { useTransitiveImpact } from './hooks/use-transitive-impact';
import { useGraph } from './wksp-cnt-graph/components/graph/use-graph';
import { usePlantUml } from './wksp-cnt-graph/components/graph/use-plantuml';

import {
  codebaseService,
  CodebaseData,
  SelectedEntity,
  ImpactDirection,
} from '@/services/codebase';

export function ExplorerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setNotification = useAppContextStore((s) => s.setNotification);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  // Feature domain state
  const [codebase, setCodebase] = useState<CodebaseData>(() => codebaseService.getCodebase());
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [impactDirection, setImpactDirection] = useState<ImpactDirection>('aval');

  const [showGrid, setShowGrid] = useState(true);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(1);
  const [currentLayout, setCurrentLayout] = useState('preset');

  // Domain rules hooks
  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(selectedEntity, impactDirection, codebase.dependencies);

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const handleSelectMember = useCallback((nodeId: string, memberId: string) => {
    setSelectedEntity({ type: 'member', nodeId, memberId });
  }, []);

  const { containerRef, cyRef, graphState, updateGraphTopology } = useGraph(isDarkMode, handleNodeSelect);

  const generatedPlantUML = usePlantUml(
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase.dependencies
  );

  useEffect(() => {
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      codebaseService.getFolderPositions()
    );
  }, [
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    updateGraphTopology,
  ]);

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  const handleImportCodebase = useCallback(
    (importedData: CodebaseData) => {
      codebaseService.importCodebase(importedData);
      setCodebase({ ...importedData });
      setNotification('AST Codebase imported successfully!');
    },
    [setNotification]
  );

  // Apply layout container configuration for Explorer Feature
  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background overflow-hidden">
              <ContainerPanelHeader title="Context Paths" path="workspace.top" />
              <div className="flex-1 min-h-0 overflow-auto">
                <ContextPathsPanel />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-card overflow-hidden">
              <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
              <div className="flex-1 min-h-0 overflow-auto">
                <CodebaseExplorerPanel
                  searchFilteredFiles={filter.searchFilteredFiles}
                  expandedFolders={filter.expandedFolders}
                  visibleFiles={filter.visibleFiles}
                  toggleFolder={filter.toggleFolder}
                  toggleFolderCheckbox={filter.toggleFolderCheckbox}
                  toggleFileCheckbox={filter.toggleFileCheckbox}
                  setSelectedEntity={setSelectedEntity}
                  onImportCodebase={handleImportCodebase}
                />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          isResizable: false,
          isHiddable: false,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background relative overflow-hidden">
              <ContainerPanelHeader
                path="workspace.center"
                isHiddable={false}
                headerLeft={<GraphPanelHeaderLeft />}
                headerCenter={
                  <GraphPanelHeaderCenter
                    maxNodesLimit={filter.maxNodesLimit}
                    setMaxNodesLimit={filter.setMaxNodesLimit}
                    callersDepth={callersDepth}
                    setCallersDepth={setCallersDepth}
                    calleesDepth={calleesDepth}
                    setCalleesDepth={setCalleesDepth}
                    displayLevel={filter.displayLevel}
                    setDisplayLevel={filter.setDisplayLevel}
                    currentLayout={currentLayout}
                    setCurrentLayout={setCurrentLayout}
                  />
                }
                headerRight={
                  <GraphPanelHeaderRight
                    cyRef={cyRef}
                    isGraphMaximized={false}
                    setIsGraphMaximized={() => toggleContainerMaximized('workspace.center')}
                    showGrid={showGrid}
                    setShowGrid={setShowGrid}
                  />
                }
              />
              <div className="flex-1 min-h-0 relative w-full h-full">
                <GraphPanel
                  containerRef={containerRef}
                  showGrid={showGrid}
                  isDarkMode={isDarkMode}
                  graphState={graphState}
                  selectedEntity={selectedEntity}
                  searchFilteredFiles={filter.searchFilteredFiles}
                  impactedSet={impactedSet}
                  handleSelectMember={handleSelectMember}
                />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-card overflow-hidden">
              <ContainerPanelHeader title="Global Inspector" path="workspace.right" />
              <div className="flex-1 min-h-0 overflow-auto">
                <GlobalInspectorPanel
                  selectedEntity={selectedEntity}
                  initialCodebase={codebase}
                  impactDirection={impactDirection}
                  setImpactDirection={setImpactDirection}
                  impactedSet={impactedSet}
                  handleCopy={handleCopy}
                  generatedPlantUML={generatedPlantUML}
                />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          container: (
            <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-background overflow-hidden">
              <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
              <div className="flex-1 min-h-0 overflow-auto">
                <WkpBottomPanel />
              </div>
            </div>
          ),
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: {
        visible: true,
        isResizable: true,
        isHiddable: true,
        container: (
          <div className="flex flex-col h-full w-full min-w-0 min-h-0 bg-card overflow-hidden">
            <ContainerPanelHeader title="Entity Properties" path="sidebarRight" />
            <div className="flex-1 min-h-0 overflow-auto">
              <EntityPropertiesPanel selectedEntity={selectedEntity} />
            </div>
          </div>
        ),
        maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [
    setLayoutContainers,
    toggleContainerMaximized,
    filter.searchFilteredFiles,
    filter.expandedFolders,
    filter.visibleFiles,
    filter.maxNodesLimit,
    filter.displayLevel,
    filter.toggleFolder,
    filter.toggleFolderCheckbox,
    filter.toggleFileCheckbox,
    filter.setMaxNodesLimit,
    filter.setDisplayLevel,
    callersDepth,
    calleesDepth,
    currentLayout,
    showGrid,
    selectedEntity,
    codebase,
    impactDirection,
    impactedSet,
    generatedPlantUML,
    handleCopy,
    handleImportCodebase,
    handleSelectMember,
    containerRef,
    cyRef,
    isDarkMode,
    graphState,
  ]);

  return null;
}

export default ExplorerFeature;
EOF

# Ensure App.tsx handles all feature menu item ID variants
cat << 'EOF' > src/App.tsx
import React from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useLayoutStore } from '@/store/useLayoutStore';
import { AppLayout } from '@/components/app/layout/AppLayout';
import { WelcomeFeature } from '@/features/welcome/WelcomeFeature';
import { LayoutDemoFeature } from '@/features/layout-demo/LayoutDemoFeature';
import { ExplorerFeature } from '@/features/explorer/ExplorerFeature';
import { RulesFeature } from '@/features/rules/RulesFeature';
import { HelpFeature } from '@/features/help/HelpFeature';

export default function App() {
  const { activeFeature, setActiveFeature, isDarkMode, setIsDarkMode, notification } = useAppContextStore();
  const { containers } = useLayoutStore();

  return (
    <>
      {/* Active Feature updates LayoutStore containers dynamically when menu items are clicked */}
      {(activeFeature === 'panel-welcome' || activeFeature === 'feature-welcome' || activeFeature === 'welcome') && <WelcomeFeature />}
      {(activeFeature === 'panel-explorer' || activeFeature === 'feature-explorer' || activeFeature === 'explorer') && <ExplorerFeature />}
      {(activeFeature === 'layout-demo' || activeFeature === 'feature-layout') && <LayoutDemoFeature />}
      {(activeFeature === 'panel-rules' || activeFeature === 'feature-rules' || activeFeature === 'rules') && <RulesFeature />}
      {(activeFeature === 'panel-help' || activeFeature === 'feature-help' || activeFeature === 'help') && <HelpFeature />}

      <AppLayout
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        notification={notification}
        layoutContainers={containers}
      />
    </>
  );
}
EOF

echo "✅ ExplorerFeature refactored to define layout containers with subfolder panels!"

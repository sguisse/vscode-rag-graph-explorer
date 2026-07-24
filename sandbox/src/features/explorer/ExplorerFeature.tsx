import React, { useState, useEffect, useCallback } from 'react';
import { Layers } from 'lucide-react';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { codebaseService, SelectedEntity, ImpactDirection, CodebaseData } from '@/services/codebase';

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
  const [codebaseData, setCodebaseData] = useState<CodebaseData>(() => codebaseService.getCodebase());
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

  const handleImportCodebase = useCallback((imported: CodebaseData) => {
    try {
      codebaseService.importCodebase(imported);
      setCodebaseData({ ...imported });
      setSelectedEntity(imported.files.length > 0 ? { type: 'node', nodeId: imported.files[0].id } : null);
      setNotification("✅ AST Codebase imported successfully!");
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      setNotification(`❌ Import failed: ${err.message || 'Invalid format'}`);
      setTimeout(() => setNotification(null), 4000);
    }
  }, []);

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
      layoutConfig={{ showCtnWkpTop: true, showCtnWkpLeft: true, showCtnWkpCenter: true, showCtnWkpRight: true, showCtnWkpBottom: true, showRightSidebar: true }}
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
            onImportCodebase={handleImportCodebase}
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
        centerPanelHeader: <GraphPanelHeaderLeft  />,
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
        centerPanelHeaderRight: <GraphPanelHeaderRight cyRef={cyRef}
                                                       isGraphMaximized={isGraphMaximized} setIsGraphMaximized={setIsGraphMaximized}
                                                       showGrid={showGrid} setShowGrid={setShowGrid} />,
        rightSidebarHeader: <><Layers size={13} className="mr-1.5"/> <span>Entity Properties</span></>
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onResetFilters={handleReset}
    />
  );
}

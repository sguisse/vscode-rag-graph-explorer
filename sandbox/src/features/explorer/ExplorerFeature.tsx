import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layers, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { initialCodebase, FOLDER_POSITIONS } from './wksp-cnt-graph/components/graph/GraphData';
import { EntityPropertiesPanel } from './sdb-rgt-properties/EntityPropertiesPanel';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphPanelHeaderLeft, GraphPanelHeaderCenter, GraphPanelHeaderRight } from './wksp-cnt-graph/GraphPanelHeader';
import { useGraph } from './wksp-cnt-graph/components/graph/use-graph';
import { usePlantUml } from './wksp-cnt-graph/components/graph/use-plantuml';
import { useCopyToClipboard } from '@/hooks/use-clipboard';

import { GlobalInspectorPanel } from './wkp-rgt-tabs-inspector/global-inspector-panel';
import { GraphPanel } from './wksp-cnt-graph/GraphPanel';

export function ExplorerFeature(props: Omit<AppLayoutProps, 'layoutConfig' | 'panels'>) {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({ 'frontend': true, 'backend': true, 'config': true });
  const [visibleFiles, setVisibleFiles] = useState<Record<string, boolean>>({
    'OrderButton.tsx': true, 'orderApi.ts': true, 'OrderController.java': true, 'Order.java': true, 'OrderRepository.java': true, 'JpaOrderRepository.java': true, 'application.yml': true
  });
  const [selectedEntity, setSelectedEntity] = useState<{ type: 'node' | 'member' | 'edge'; nodeId: string; memberId?: string; } | null>({ type: 'node', nodeId: 'OrderController.java' });
  const [impactDirection, setImpactDirection] = useState<'aval' | 'amont'>('aval');
  const [impactedSet, setImpactedSet] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<string | null>(null);

  const [maxNodesLimit, setMaxNodesLimit] = useState(50);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(0);
  const [displayLevel, setDisplayLevel] = useState('all');
  const [currentLayout, setCurrentLayout] = useState('preset');
  const [showGrid, setShowGrid] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);

  const { copy } = useCopyToClipboard();

  const handleCopy = (text: string, message: string) => {
    copy(text, () => {
      setNotification(message);
      setTimeout(() => setNotification(null), 3000);
    });
  };

  // Graph Hook Setup
  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const { containerRef, cyRef, graphState, updateGraphTopology } = useGraph(props.isDarkMode, handleNodeSelect);

  const toggleFolder = (folderName: string) => setExpandedFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));
  const toggleFolderCheckbox = (folderName: string) => {
    const isCurrentlyChecked = initialCodebase.files.filter(f => f.path.startsWith(folderName)).every(f => visibleFiles[f.id]);
    const targetState = !isCurrentlyChecked;
    const updated = { ...visibleFiles };
    initialCodebase.files.forEach(file => { if (file.path.startsWith(folderName)) updated[file.id] = targetState; });
    setVisibleFiles(updated);
  };
  const toggleFileCheckbox = (fileId: string) => setVisibleFiles(prev => ({ ...prev, [fileId]: !prev[fileId] }));
  const handleSelectMember = (nodeId: string, memberId: string) => setSelectedEntity({ type: 'member', nodeId, memberId });

  // Transitive BFS Impact Propagation
  useEffect(() => {
    if (!selectedEntity) { setImpactedSet(new Set()); return; }
    const visited = new Set<string>();
    const queue: string[] = [];
    let startKey = selectedEntity.type === 'member' ? `${selectedEntity.nodeId}__member__${selectedEntity.memberId}` : selectedEntity.nodeId;

    if (startKey) { queue.push(startKey); visited.add(startKey); }

    while (queue.length > 0) {
      const current = queue.shift()!;
      initialCodebase.dependencies.forEach(dep => {
        const sourceKeyMember = `${dep.sourceNode}__member__${dep.sourceHandle}`;
        const targetKeyMember = `${dep.targetNode}__member__${dep.targetHandle}`;
        const sourceKey = dep.sourceHandle === 'header' ? dep.sourceNode : sourceKeyMember;
        const targetKey = dep.targetHandle === 'header' ? dep.targetNode : targetKeyMember;

        if (impactDirection === 'aval') {
          if (current === dep.sourceNode || current === sourceKey) {
            if (!visited.has(targetKey)) { visited.add(targetKey); visited.add(dep.targetNode); queue.push(targetKey); }
          }
        } else {
          if (current === dep.targetNode || current === targetKey) {
            if (!visited.has(sourceKey)) { visited.add(sourceKey); visited.add(dep.sourceNode); queue.push(sourceKey); }
          }
        }
      });
    }
    setImpactedSet(visited);
  }, [selectedEntity, impactDirection]);

  const searchFilteredFiles = useMemo(() => {
    return initialCodebase.files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) || file.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = displayLevel === 'all' || file.type === displayLevel;
      return matchesSearch && visibleFiles[file.id] && matchesLevel;
    }).slice(0, maxNodesLimit);
  }, [searchTerm, visibleFiles, displayLevel, maxNodesLimit]);

  // PlantUML Generation Hook
  const generatedPlantUML = usePlantUml(searchFilteredFiles, visibleFiles, initialCodebase.dependencies);

  // Push new state to Cytoscape engine wrapper
  useEffect(() => {
    updateGraphTopology(searchFilteredFiles, visibleFiles, initialCodebase, impactedSet, currentLayout, FOLDER_POSITIONS);
  }, [searchFilteredFiles, visibleFiles, impactedSet, currentLayout, updateGraphTopology]);

  const applyLayout = useCallback((layout: string) => { setCurrentLayout(layout); }, []);

  return (
    <AppLayout
      {...props}
      isGraphMaximized={isGraphMaximized}
      layoutConfig={{ showTop: true, showLeft: true, showCenter: true, showRight: true, showBottom: true, showRightSidebar: true }}
      notification={notification}
      panels={{
        left: <CodebaseExplorerPanel searchFilteredFiles={searchFilteredFiles} expandedFolders={expandedFolders} visibleFiles={visibleFiles} toggleFolder={toggleFolder} toggleFolderCheckbox={toggleFolderCheckbox} toggleFileCheckbox={toggleFileCheckbox} setSelectedEntity={setSelectedEntity} />,
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
            initialCodebase={initialCodebase}
            impactDirection={impactDirection}
            setImpactDirection={setImpactDirection}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
            generatedPlantUML={generatedPlantUML}
          />
        ),
        top: <div className="p-3 font-mono text-muted-foreground text-xs">/Users/workspace/path</div>,
        bottom: <div className="px-4 py-2 font-medium text-muted-foreground text-xs">AST Compilation Log: Matrix Active</div>,
        rightSidebar: <EntityPropertiesPanel selectedEntity={selectedEntity} />
      }}
      headers={{
        leftPanelTitle: "AST Explorer",
        centerPanelHeader: <GraphPanelHeaderLeft showGrid={showGrid} setShowGrid={setShowGrid} />,
        centerPanelHeaderCenter: <GraphPanelHeaderCenter maxNodesLimit={maxNodesLimit} setMaxNodesLimit={setMaxNodesLimit} callersDepth={callersDepth} setCallersDepth={setCallersDepth} calleesDepth={calleesDepth} setCalleesDepth={setCalleesDepth} displayLevel={displayLevel} setDisplayLevel={setDisplayLevel} currentLayout={currentLayout} setCurrentLayout={applyLayout} />,
        centerPanelHeaderRight: <GraphPanelHeaderRight cyRef={cyRef} isGraphMaximized={isGraphMaximized} setIsGraphMaximized={setIsGraphMaximized} />,
        rightSidebarHeader: <><Layers size={13} className="mr-1.5"/> <span>Entity Properties</span></>,
        rightSidebarHeaderRight: <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setSelectedEntity(null)}><X size={12}/></Button>
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onResetFilters={() => { setVisibleFiles({ 'OrderButton.tsx': true, 'orderApi.ts': true, 'OrderController.java': true, 'Order.java': true, 'OrderRepository.java': true, 'application.yml': true }); setSearchTerm(''); setDisplayLevel('all'); setSelectedEntity(null); }}
    />
  );
}

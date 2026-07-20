import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layers, X, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { JSON_SCHEMA_SPEC, initialCodebase, FOLDER_POSITIONS } from './wksp-cnt-graph/components/graph/GraphData';
import { EntityPropertiesPanel } from './sdb-rgt-properties/EntityPropertiesPanel';
import { CodebaseExplorerPanel } from './wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { GraphContainerHeaderLeft, GraphContainerHeaderCenter, GraphContainerHeaderRight } from './wksp-cnt-graph/GraphContainerHeader';
import { FolderNode, UmlClassNode, ConfigNode } from './wksp-cnt-graph/components/graph/GraphUmlShapes';
import { useGraph } from './wksp-cnt-graph/components/graph/use-graph';
import { usePlantUml } from './wksp-cnt-graph/components/graph/use-plantuml';
import { useCopyToClipboard } from '@/hooks/use-clipboard';

import { InspectorTabPanel } from './wkp-rgt-tabs-inspector/inspector-tab-panel';
import { PlantUmlTabPanel } from './wkp-rgt-tabs-inspector/plantuml-tab-panel';
import { JsonTabPanel } from './wkp-rgt-tabs-inspector/json-tab-panel';

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
  const [rightPanelTab, setRightPanelTab] = useState<'inspect' | 'plantuml' | 'json_schema'>('inspect');
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

  const rightContent = (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b shrink-0">
        <Button variant="ghost" onClick={() => setRightPanelTab('inspect')} className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}>Inspector</Button>
        <Button variant="ghost" onClick={() => setRightPanelTab('plantuml')} className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'plantuml' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}>PlantUML</Button>
        <Button variant="ghost" onClick={() => setRightPanelTab('json_schema')} className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'json_schema' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}>JSON Schema</Button>
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

  return (
    <AppLayout
      {...props}
      isGraphMaximized={isGraphMaximized}
      layoutConfig={{ showTop: true, showLeft: true, showCenter: true, showRight: true, showBottom: true, showRightSidebar: true }}
      notification={notification}
      panels={{
        left: <CodebaseExplorerPanel searchFilteredFiles={searchFilteredFiles} expandedFolders={expandedFolders} visibleFiles={visibleFiles} toggleFolder={toggleFolder} toggleFolderCheckbox={toggleFolderCheckbox} toggleFileCheckbox={toggleFileCheckbox} setSelectedEntity={setSelectedEntity} />,
        center: (
          <div className="absolute inset-0 outline-none w-full h-full overflow-hidden">
            <div ref={containerRef} className="z-0 absolute inset-0 w-full h-full" style={showGrid ? { backgroundImage: props.isDarkMode ? 'radial-gradient(#334155 1.2px, transparent 1.2px)' : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)', backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`, backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px` } : undefined} />

            <div className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none" style={{ transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})` }}>
              {Object.entries(FOLDER_POSITIONS).map(([folderKey, initialPos]) => {
                const bounds = graphState.nodePositions[`folder__${folderKey}`];
                if (!bounds) return null;
                const isSelected = selectedEntity?.nodeId === `folder__${folderKey}`;
                return (
                  <div key={`folder-box-${folderKey}`} className="z-10 absolute transition-all duration-75 ease-out" style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}>
                    <FolderNode data={{ label: initialPos.label }} isSelected={isSelected} />
                  </div>
                );
              })}

              {searchFilteredFiles.map(file => {
                const bounds = graphState.nodePositions[file.id];
                if (!bounds) return null;

                const impactedMembers: string[] = [];
                impactedSet.forEach(item => { if (item.startsWith(`${file.id}__member__`)) impactedMembers.push(item.split('__member__')[1]); });
                const isNodeImpacted = impactedSet.has(file.id);
                const isDimmed = selectedEntity !== null && impactedSet.size > 0 && !isNodeImpacted;

                const nodeData = { ...file, isDimmed, impactedMembers, selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined, onSelectMember: handleSelectMember };

                return (
                  <div key={file.id} className="z-20 absolute transition-all duration-75 ease-out pointer-events-none" style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}>
                    {file.type === 'config' ? <ConfigNode id={file.id} data={nodeData} /> : <UmlClassNode id={file.id} data={nodeData} />}
                  </div>
                );
              })}
            </div>

            <div className="top-4 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto">
              <div className="flex items-center gap-2 mb-1"><Info size={14} className="text-primary" /><span className="font-bold">Surgical Analysis (Cytoscape Engine)</span></div>
              <p className="text-[10px] text-muted-foreground">Le drag-and-drop sur les en-têtes et le zoom molette utilisent l'architecture réactive de Cytoscape.</p>
            </div>
          </div>
        ),
        right: rightContent,
        top: <div className="p-3 font-mono text-muted-foreground text-xs">/Users/workspace/path</div>,
        bottom: <div className="px-4 py-2 font-medium text-muted-foreground text-xs">AST Compilation Log: Matrix Active</div>,
        rightSidebar: <EntityPropertiesPanel selectedEntity={selectedEntity} />
      }}
      headers={{
        leftPanelTitle: "AST Explorer",
        centerPanelHeader: <GraphContainerHeaderLeft showGrid={showGrid} setShowGrid={setShowGrid} />,
        centerPanelHeaderCenter: <GraphContainerHeaderCenter maxNodesLimit={maxNodesLimit} setMaxNodesLimit={setMaxNodesLimit} callersDepth={callersDepth} setCallersDepth={setCallersDepth} calleesDepth={calleesDepth} setCalleesDepth={setCalleesDepth} displayLevel={displayLevel} setDisplayLevel={setDisplayLevel} currentLayout={currentLayout} setCurrentLayout={applyLayout} />,
        centerPanelHeaderRight: <GraphContainerHeaderRight cyRef={cyRef} isGraphMaximized={isGraphMaximized} setIsGraphMaximized={setIsGraphMaximized} />,
        rightSidebarHeader: <><Layers size={13} className="mr-1.5"/> <span>Entity Properties</span></>,
        rightSidebarHeaderRight: <Button variant="ghost" size="icon" className="w-5 h-5 text-muted-foreground" onClick={() => setSelectedEntity(null)}><X size={12}/></Button>
      }}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onResetFilters={() => { setVisibleFiles({ 'OrderButton.tsx': true, 'orderApi.ts': true, 'OrderController.java': true, 'Order.java': true, 'OrderRepository.java': true, 'application.yml': true }); setSearchTerm(''); setDisplayLevel('all'); setSelectedEntity(null); }}
    />
  );
}

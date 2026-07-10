import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layers, X, Info, ShieldAlert, GitFork, Copy, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout, AppLayoutProps } from '@/components/app/layout/AppLayout';
import { JSON_SCHEMA_SPEC, initialCodebase, FOLDER_POSITIONS } from './components/graph/GraphData';
import { EntityPropertiesSidebar } from './components/EntityPropertiesSidebar';
import { CodebaseExplorerPanel } from './components/CodebaseExplorerPanel';
import { GraphContainerHeaderLeft, GraphContainerHeaderCenter, GraphContainerHeaderRight } from './components/GraphContainerHeader';
import { FolderNode, UmlClassNode, ConfigNode } from './components/graph/GraphUmlShapes';
import { useGraph } from './components/graph/use-graph';
import { usePlantUml } from './components/graph/use-plantuml';
import { JsonViewer } from '@/components/ui/json-viewer';

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

  const [maxNodesLimit, setMaxNodesLimit] = useState(50);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(0);
  const [displayLevel, setDisplayLevel] = useState('all');
  const [currentLayout, setCurrentLayout] = useState('preset');
  const [showGrid, setShowGrid] = useState(true);
  const [isGraphMaximized, setIsGraphMaximized] = useState(false);

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
    initialCodebase.files.forEach(file => {
      if (impactedSet.has(file.id)) { md += `- [ ] **${file.name}** (\`${file.path}\`)\n`; }
    });
    return md;
  }, [selectedEntity, impactDirection, impactedSet]);

  const rightContent = (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b shrink-0">
        <Button variant="ghost" onClick={() => setRightPanelTab('inspect')} className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}>Inspector</Button>
        <Button variant="ghost" onClick={() => setRightPanelTab('plantuml')} className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'plantuml' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}>PlantUML</Button>
        <Button variant="ghost" onClick={() => setRightPanelTab('json_schema')} className={`flex-1 py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'json_schema' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}>JSON Schema</Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {rightPanelTab === 'inspect' && (
          selectedEntity ? (
            (() => {
              const currentFile = initialCodebase.files.find(f => f.id === selectedEntity.nodeId);
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
                        currentFile.methods?.find(m => m.id === selectedEntity.memberId)?.description ||
                        currentFile.configProperties?.find(p => p.key === selectedEntity.memberId)?.value ||
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
                      <Button onClick={() => navigator.clipboard.writeText(generatedMarkdownRecipe)} className="flex items-center gap-1 bg-muted hover:bg-muted/80 px-2 py-1 border border-border rounded h-6 font-mono text-[10px] text-foreground">
                        <Copy size={10} />Copy Recipes
                      </Button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {initialCodebase.files.map(f => impactedSet.has(f.id) ? (
                        <div key={f.id} className="flex justify-between items-center bg-background px-2 py-1.5 border border-orange-500/20 rounded font-mono text-[11px]"><span className="font-semibold text-foreground truncate">{f.name}</span><span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">{f.language}</span></div>
                      ) : null)}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-12 text-muted-foreground text-center">
              <ShieldAlert size={36} className="opacity-40 mx-auto mb-2 text-muted-foreground" />
              <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
              <p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">Click any file component link row or surgical grid handle item to initialize graph mapping parameters.</p>
            </div>
          )
        )}
        {rightPanelTab === 'plantuml' && (
          <div className="relative group h-full">
            <Button onClick={() => navigator.clipboard.writeText(generatedPlantUML)} className="absolute top-3 right-5 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 border border-slate-600 rounded h-6 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10" data-tooltip="Copy PlantUML code to clipboard">
              <Copy size={10} /> Copy
            </Button>
            <pre className="bg-black/90 h-full p-3 rounded-lg overflow-x-auto text-[10px] text-white whitespace-pre-wrap">{generatedPlantUML}</pre>
          </div>
        )}
        {rightPanelTab === 'json_schema' && (
          <div className="relative group h-full">
            <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(JSON_SCHEMA_SPEC, null, 2))} className="absolute top-3 right-5 flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-white px-2 py-1 border border-slate-600 rounded h-6 font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10" data-tooltip="Copy JSON Schema to clipboard">
              <Copy size={10} /> Copy
            </Button>
            <JsonViewer data={JSON_SCHEMA_SPEC} className="h-full" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <AppLayout
      {...props}
      layoutConfig={{ showTop: true, showLeft: true, showCenter: true, showRight: true, showBottom: true, showRightSidebar: true }}
      panels={{
        left: <CodebaseExplorerPanel searchFilteredFiles={searchFilteredFiles} expandedFolders={expandedFolders} visibleFiles={visibleFiles} toggleFolder={toggleFolder} toggleFolderCheckbox={toggleFolderCheckbox} toggleFileCheckbox={toggleFileCheckbox} setSelectedEntity={setSelectedEntity} />,
        center: (
          <div className="absolute inset-0 outline-none w-full h-full overflow-hidden">
            <div ref={containerRef} className="z-0 absolute inset-0 w-full h-full" style={showGrid ? { backgroundImage: props.isDarkMode ? 'radial-gradient(#334155 1.2px, transparent 1.2px)' : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)', backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`, backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px` } : undefined} />

            {/* HTML Overlay Syncing with Cytoscape Coordinates */}
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
        rightSidebar: <EntityPropertiesSidebar selectedEntity={selectedEntity} />
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

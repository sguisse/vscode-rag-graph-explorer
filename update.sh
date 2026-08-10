#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src/services/view
mkdir -p webview/src/features/explorer/hooks
mkdir -p webview/src/features/explorer/wkp-rgt-tabs-inspector
mkdir -p webview/src/features/explorer

# 1. Update prompt-view.service.ts to support dual downstream/upstream propagation status
cat << 'EOF' > webview/src/services/view/prompt-view.service.ts
import { SelectedEntity, CodebaseData, CodebaseFile } from "@/shared/services/graph-rag-explorer";

export function generateMarkdownRecipe(
    selectedEntity: SelectedEntity | null,
    enableDownstream: boolean,
    enableUpstream: boolean,
    impactedSet: Set<string>,
    codebase: CodebaseData
  ): string {
    let md = `### 🛡️ Impact Plan & Polyglot Recipe Sheet\n\n`;
    let startElement = 'Undefined';
    if (selectedEntity) {
      if (selectedEntity.type === 'member') {
        startElement = `Method \`${selectedEntity.memberId}()\` of \`${selectedEntity.nodeId}\``;
      } else {
        startElement = `File \`${selectedEntity.nodeId}\``;
      }
    }
    md += `**Trigger Element :** ${startElement}\n`;
    const dirs: string[] = [];
    if (enableDownstream) dirs.push('Downstream (Descendants callees)');
    if (enableUpstream) dirs.push('Upstream (Ascending callers)');
    md += `**Direction of Propagation :** ${dirs.length > 0 ? dirs.join(' & ') : 'None'}\n\n`;
    md += `#### 📋 List of components to retest\n\n`;
    codebase.files.forEach((file: CodebaseFile) => {
      if (impactedSet.has(file.id)) {
        md += `- [ ] **${file.name}** (\`${file.path}\`)\n`;
      }
    });
    return md;
  }
EOF

# 2. Update graph-view.service.ts to conditionally execute BFS based on enableDownstream and enableUpstream flags
cat << 'EOF' > webview/src/services/view/graph-view.service.ts
import { CodebaseData, CodebaseFile, Dependency, SelectedEntity } from "@/shared/services/graph-rag-explorer";
import { initialCodebase } from "@/features/explorer/wksp-cnt-graph/components/graph/GraphData";
import { MEMBER_KEY_SEPARATOR_TOKEN } from "@/shared/services/graph-rag-explorer/domain/model/codebase.constants";
import { logInfo } from "./log-view.service.wrapper";

function buildMemberKeyTokenSync(nodeId: string, memberId: string): string {
    return `${nodeId}${MEMBER_KEY_SEPARATOR_TOKEN}${memberId}`;
}

export function buildMemberKeyToken(nodeId: string, memberId: string): string {
    return buildMemberKeyTokenSync(nodeId, memberId);
}

export function isMemberKeyForFileToken(key: string, fileId: string): boolean {
    return key.startsWith(`${fileId}${MEMBER_KEY_SEPARATOR_TOKEN}`);
}

export function extractMemberIdFromKeyToken(key: string): string {
    return key.split(MEMBER_KEY_SEPARATOR_TOKEN)[1] || '';
}

export function calculateTransitiveImpact(
    selectedEntity: SelectedEntity | null,
    dependencies: Dependency[],
    callersDepth: number = 1,
    calleesDepth: number = 1,
    enableDownstream: boolean = true,
    enableUpstream: boolean = false
): Set<string> {
    if (!selectedEntity) return new Set<string>();

    const visited = new Set<string>();

    const startKey = selectedEntity.type === 'member' && selectedEntity.memberId
      ? buildMemberKeyTokenSync(selectedEntity.nodeId, selectedEntity.memberId)
      : selectedEntity.nodeId;

    if (!startKey) return visited;

    visited.add(startKey);
    visited.add(selectedEntity.nodeId);

    const runBfs = (direction: 'callee' | 'caller', maxDepth: number) => {
      if (maxDepth < 1) return;

      const queue: Array<{ key: string; depth: number }> = [{ key: startKey, depth: 0 }];

      while (queue.length > 0) {
        const { key: current, depth } = queue.shift()!;

        if (depth >= maxDepth) continue;

        dependencies.forEach(dep => {
          const depSourceNode = dep.sourceNode || dep.source;
          const depTargetNode = dep.targetNode || dep.target;
          const depSourceHandle = dep.sourceHandle || 'header';
          const depTargetHandle = dep.targetHandle || 'header';

          if (!depSourceNode || !depTargetNode) return;

          const sourceKeyMember = buildMemberKeyTokenSync(depSourceNode, depSourceHandle);
          const targetKeyMember = buildMemberKeyTokenSync(depTargetNode, depTargetHandle);
          const sourceKey = depSourceHandle === 'header' ? depSourceNode : sourceKeyMember;
          const targetKey = depTargetHandle === 'header' ? depTargetNode : targetKeyMember;

          if (direction === 'callee') {
            if (current === depSourceNode || current === sourceKey || current === sourceKeyMember) {
              if (!visited.has(targetKey) || !visited.has(depTargetNode)) {
                visited.add(targetKey);
                visited.add(depTargetNode);
                queue.push({ key: targetKey, depth: depth + 1 });
              }
            }
          } else {
            if (current === depTargetNode || current === targetKey || current === targetKeyMember) {
              if (!visited.has(sourceKey) || !visited.has(depSourceNode)) {
                visited.add(sourceKey);
                visited.add(depSourceNode);
                queue.push({ key: sourceKey, depth: depth + 1 });
              }
            }
          }
        });
      }
    };

    // Run Upstream callers traversal if enabled
    if (enableUpstream) {
      runBfs('caller', callersDepth);
    }

    // Run Downstream callees traversal if enabled
    if (enableDownstream) {
      runBfs('callee', calleesDepth);
    }

    return visited;
}

export function filterCodebaseFiles(
    files: CodebaseFile[],
    searchTerm: string,
    displayLevel: string,
    visibleFiles: Record<string, boolean>,
    maxNodesLimit: number
): CodebaseFile[] {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            file.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = displayLevel === 'all' || file.type === displayLevel;
      return matchesSearch && visibleFiles[file.id] && matchesLevel;
    }).slice(0, maxNodesLimit);
}

export function getPathsChangeImpacts(paths: string | string[]): CodebaseData {
    logInfo(`[getPathsChangeImpacts] Neo4j service is currently disabled. Returning initialCodebase as fallback.`);
    return initialCodebase;
}

export const getpathsChangeImpacts = getPathsChangeImpacts;
EOF

# 3. Update use-transitive-impact.ts hook to pass enableDownstream and enableUpstream flags
cat << 'EOF' > webview/src/features/explorer/hooks/use-transitive-impact.ts
import { useState, useEffect } from 'react';
import { SelectedEntity, Dependency } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';

export function useTransitiveImpact(
  selectedEntity: SelectedEntity | null,
  dependencies: Dependency[],
  callersDepth: number = 1,
  calleesDepth: number = 1,
  enableDownstream: boolean = true,
  enableUpstream: boolean = false
) {
  const [impactedSet, setImpactedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const calculatedImpact = calculateTransitiveImpact(
      selectedEntity,
      dependencies,
      callersDepth,
      calleesDepth,
      enableDownstream,
      enableUpstream
    );
    setImpactedSet(calculatedImpact);
  }, [selectedEntity, dependencies, callersDepth, calleesDepth, enableDownstream, enableUpstream]);

  return { impactedSet, setImpactedSet };
}
EOF

# 4. Update inspector-tab-panel.tsx to support independent toggling for Downstream and Upstream
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-inspector/inspector-tab-panel.tsx
import React, { useMemo } from 'react';
import { FileCode, ShieldAlert, GitFork, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';
import { generateMarkdownRecipe } from '@/services/view/prompt-view.service';

interface InspectorTabPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function InspectorTabPanel({
  selectedEntity,
  initialCodebase,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: InspectorTabPanelProps) {

  const generatedMarkdownRecipe = useMemo(() => {
    return generateMarkdownRecipe(selectedEntity, enableDownstream, enableUpstream, impactedSet, initialCodebase);
  }, [selectedEntity, enableDownstream, enableUpstream, impactedSet, initialCodebase]);

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
          <Button
            onClick={() => setEnableDownstream(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableDownstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} className="rotate-180" />
            Downstream
          </Button>
          <Button
            onClick={() => setEnableUpstream(prev => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableUpstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} />
            Upstream
          </Button>
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

# 5. Update global-inspector-panel.tsx to forward enableDownstream and enableUpstream props
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-inspector/global-inspector-panel.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InspectorTabPanel } from './inspector-tab-panel';
import { PlantUmlTabPanel } from './plantuml-tab-panel';
import { JsonTabPanel } from './json-tab-panel';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';

interface GlobalInspectorPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
  generatedPlantUML: string;
}

export function GlobalInspectorPanel({
  selectedEntity,
  initialCodebase,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
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
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
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

# 6. Update ExplorerFeature.tsx to maintain enableDownstream and enableUpstream states
cat << 'EOF' > webview/src/features/explorer/ExplorerFeature.tsx
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

import { initialCodebase, FOLDER_POSITIONS } from './wksp-cnt-graph/components/graph/GraphData';

import {
  CodebaseData,
  SelectedEntity,
} from '@/shared/services/graph-rag-explorer';

export function ExplorerFeature() {
  const setLayoutContainers = useLayoutStore((s) => s.setLayoutContainers);
  const setContainerContent = useLayoutStore((s) => s.setContainerContent);
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setNotification = useAppContextStore((s) => s.setNotification);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const [codebase, setCodebase] = useState<CodebaseData>(initialCodebase);
  const [folderPositions, setFolderPositions] = useState<Record<string, { label: string }>>(FOLDER_POSITIONS);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);

  const [enableDownstream, setEnableDownstream] = useState<boolean>(true);
  const [enableUpstream, setEnableUpstream] = useState<boolean>(false);

  const [showGrid, setShowGrid] = useState(true);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(1);
  const [currentLayout, setCurrentLayout] = useState('preset');

  const [attributesVisible, setAttributesVisible] = useState(false);
  const [methodsVisible, setMethodsVisible] = useState(true);
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleNodeSelect = useCallback((nodeId: string) => {
    setSelectedEntity({ type: 'node', nodeId });
  }, []);

  const handleSelectMember = useCallback((nodeId: string, memberId: string) => {
    setSelectedEntity({ type: 'member', nodeId, memberId });
  }, []);

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(isDarkMode, handleNodeSelect);

  const generatedPlantUML = usePlantUml(
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase.dependencies
  );

  useEffect(() => {
    if (!isReady || Object.keys(folderPositions).length === 0) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
    attributesVisible,
    methodsVisible,
    selectedEntity,
    showSelectedOnly,
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
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setNotification]
  );

  useEffect(() => {
    setLayoutContainers({
      header: { visible: true, isResizable: false, isHiddable: false },
      sidebarLeft: { visible: true, isResizable: true, isHiddable: true },
      workspace: {
        top: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        left: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        center: {
          visible: true,
          isResizable: false,
          isHiddable: false,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
        },
        right: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
        bottom: {
          visible: true,
          isResizable: true,
          isHiddable: true,
          maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' },
        },
      },
      sidebarRight: {
        visible: true,
        isResizable: true,
        isHiddable: true,
        maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' },
      },
      footer: { visible: true, isResizable: false, isHiddable: false },
    });
  }, [setLayoutContainers]);

  useEffect(() => {
    setContainerContent(
      'workspace.top',
      <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Context Paths" path="workspace.top" />
        <div className="flex-1 min-h-0 overflow-auto">
          <ContextPathsPanel />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.left',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
        <div className="flex-1 min-h-0 overflow-auto">
          <CodebaseExplorerPanel
            codebase={codebase}
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
    );

    setContainerContent(
      'workspace.center',
      <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
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
              attributesVisible={attributesVisible}
              setAttributesVisible={setAttributesVisible}
              methodsVisible={methodsVisible}
              setMethodsVisible={setMethodsVisible}
              showSelectedOnly={showSelectedOnly}
              setShowSelectedOnly={setShowSelectedOnly}
            />
          }
        />
        <div className="relative flex-1 w-full h-full min-h-0">
          <GraphPanel
            folderPositions={folderPositions}
            containerRef={containerRef}
            showGrid={showGrid}
            isDarkMode={isDarkMode}
            graphState={graphState}
            selectedEntity={selectedEntity}
            searchFilteredFiles={filter.searchFilteredFiles}
            impactedSet={impactedSet}
            handleSelectMember={handleSelectMember}
            attributesVisible={attributesVisible}
            methodsVisible={methodsVisible}
            showSelectedOnly={showSelectedOnly}
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.right',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Global Inspector" path="workspace.right" />
        <div className="flex-1 min-h-0 overflow-auto">
          <GlobalInspectorPanel
            selectedEntity={selectedEntity}
            initialCodebase={codebase}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
            generatedPlantUML={generatedPlantUML}
          />
        </div>
      </div>
    );

    setContainerContent(
      'workspace.bottom',
      <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
        <div className="flex-1 min-h-0 overflow-auto">
          <WkpBottomPanel />
        </div>
      </div>
    );

    setContainerContent(
      'sidebarRight',
      <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
        <ContainerPanelHeader title="Entity Properties" path="sidebarRight" />
        <div className="flex-1 min-h-0 overflow-auto">
          <EntityPropertiesPanel selectedEntity={selectedEntity} />
        </div>
      </div>
    );
  }, [
    setContainerContent,
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
    attributesVisible,
    methodsVisible,
    showSelectedOnly,
    selectedEntity,
    codebase,
    folderPositions,
    enableDownstream,
    enableUpstream,
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

echo "✅ feat: Enabled independent and simultaneous toggling for Downstream and Upstream impact propagation!"

# Rebuild webview
npm run build:webview

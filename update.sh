#!/usr/bin/env bash
set -e

# 1. Ensure target store and features directories exist
mkdir -p src/webview/store
mkdir -p src/webview/features/explorer

# 2. Update useLayoutStore.ts to preserve user-toggled container visibility and maximize states across re-renders
cat << 'EOF' > src/webview/store/useLayoutStore.ts
import React from 'react';
import { create } from 'zustand';
import { AppLayoutContainers, LayoutContainer } from '../components/app/layout/types';
import { defaultLayoutContainersContent } from '../features/layout-demo/default-layout-containers-content';

export interface LayoutStoreState {
  containers: AppLayoutContainers;

  setLayoutContainers: (containers: AppLayoutContainers, preserveVisibility?: boolean) => void;
  setContainerVisible: (keyPath: string, visible: boolean) => void;
  toggleContainerVisible: (keyPath: string) => void;
  setContainerContent: (keyPath: string, content: React.ReactNode) => void;
  setContainerMaximized: (keyPath: string, isMaximized: boolean) => void;
  toggleContainerMaximized: (keyPath: string) => void;
  resetContainers: () => void;
}

export const defaultLayoutContainers: AppLayoutContainers = {
  header: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
  sidebarLeft: { visible: true, isResizable: true, isHiddable: true, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
  workspace: {
    top: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.top, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    left: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.left, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    center: { visible: true, isResizable: false, isHiddable: false, container: defaultLayoutContainersContent.center, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
    right: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.right, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
    bottom: { visible: true, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.bottom, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Workspace' } },
  },
  sidebarRight: { visible: false, isResizable: true, isHiddable: true, container: defaultLayoutContainersContent.sidebarRight, maximizeContainer: { isMaximizable: true, isMaximized: false, maximizeScope: 'Main' } },
  footer: { visible: true, isResizable: false, isHiddable: false, maximizeContainer: { isMaximizable: false, isMaximized: false, maximizeScope: 'Main' } },
};

function preserveRuntimeState(nextC?: LayoutContainer, prevC?: LayoutContainer): LayoutContainer | undefined {
  if (!nextC) return prevC;
  if (!prevC) return nextC;
  return {
    ...nextC,
    visible: prevC.visible !== undefined ? prevC.visible : nextC.visible,
    maximizeContainer: nextC.maximizeContainer ? {
      ...nextC.maximizeContainer,
      isMaximized: prevC.maximizeContainer?.isMaximized !== undefined
        ? prevC.maximizeContainer.isMaximized
        : nextC.maximizeContainer?.isMaximized
    } : prevC.maximizeContainer
  };
}

function setByPath(obj: any, path: string, updater: (c: LayoutContainer) => LayoutContainer): any {
  const parts = path.split('.');
  const cloned = { ...obj };

  let current = cloned;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    current[key] = { ...current[key] };
    current = current[key];
  }

  const lastKey = parts[parts.length - 1];
  current[lastKey] = updater(current[lastKey] || {});
  return cloned;
}

export const useLayoutStore = create<LayoutStoreState>((set) => ({
  containers: defaultLayoutContainers,

  setLayoutContainers: (newContainers, preserveVisibility = true) =>
    set((state) => {
      if (!preserveVisibility) {
        return { containers: newContainers };
      }
      return {
        containers: {
          header: preserveRuntimeState(newContainers.header, state.containers.header),
          sidebarLeft: preserveRuntimeState(newContainers.sidebarLeft, state.containers.sidebarLeft),
          workspace: {
            top: preserveRuntimeState(newContainers.workspace?.top, state.containers.workspace?.top),
            left: preserveRuntimeState(newContainers.workspace?.left, state.containers.workspace?.left),
            center: preserveRuntimeState(newContainers.workspace?.center, state.containers.workspace?.center),
            right: preserveRuntimeState(newContainers.workspace?.right, state.containers.workspace?.right),
            bottom: preserveRuntimeState(newContainers.workspace?.bottom, state.containers.workspace?.bottom),
          },
          sidebarRight: preserveRuntimeState(newContainers.sidebarRight, state.containers.sidebarRight),
          footer: preserveRuntimeState(newContainers.footer, state.containers.footer),
        }
      };
    }),

  setContainerVisible: (path, visible) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        visible,
        maximizeContainer: {
          ...c.maximizeContainer,
          isMaximized: visible ? c.maximizeContainer?.isMaximized : false,
        },
      })),
    })),

  toggleContainerVisible: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => {
        const nextVisible = !c.visible;
        return {
          ...c,
          visible: nextVisible,
          maximizeContainer: {
            ...c.maximizeContainer,
            isMaximized: nextVisible ? c.maximizeContainer?.isMaximized : false,
          },
        };
      }),
    })),

  setContainerContent: (path, container) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({ ...c, container })),
    })),

  setContainerMaximized: (path, isMaximized) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => ({
        ...c,
        maximizeContainer: {
          ...c.maximizeContainer,
          isMaximized,
        },
      })),
    })),

  toggleContainerMaximized: (path) =>
    set((state) => ({
      containers: setByPath(state.containers, path, (c) => {
        if (c.maximizeContainer?.isMaximizable === false) {
          return c;
        }
        return {
          ...c,
          maximizeContainer: {
            ...c.maximizeContainer,
            isMaximized: !c.maximizeContainer?.isMaximized,
          },
        };
      }),
    })),

  resetContainers: () => set({ containers: defaultLayoutContainers }),
}));
EOF

# 3. Update ExplorerFeature.tsx to pass handleNodeSelect to GraphPanel
cat << 'EOF' > src/webview/features/explorer/ExplorerFeature.tsx
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

  const [codebase, setCodebase] = useState<CodebaseData>(() => codebaseService.getCodebase());
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [impactDirection, setImpactDirection] = useState<ImpactDirection>('aval');

  const [showGrid, setShowGrid] = useState(true);
  const [callersDepth, setCallersDepth] = useState(1);
  const [calleesDepth, setCalleesDepth] = useState(1);
  const [currentLayout, setCurrentLayout] = useState('preset');

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(selectedEntity, impactDirection, codebase.dependencies);

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
    if (!isReady) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      codebaseService.getFolderPositions()
    );
  }, [
    isReady,
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
                  handleNodeSelect={handleNodeSelect}
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
    handleNodeSelect,
    containerRef,
    cyRef,
    isDarkMode,
    graphState,
  ]);

  return null;
}

export default ExplorerFeature;
EOF

# 4. Rebuild project bundle
echo "✅ fix: Resolved layout toggle flash by preserving user-selected panel visibility in Zustand store across feature re-renders!"
npm run compile

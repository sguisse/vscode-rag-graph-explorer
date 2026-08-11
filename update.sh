#!/usr/bin/env bash
set -e

# Ensure all target directories exist
mkdir -p shared/services/vscode/domain/port-out
mkdir -p shared/config
mkdir -p backend/src/services/vscode
mkdir -p backend/src/config
mkdir -p webview/src/services/api
mkdir -p webview/src/features/explorer

# 1. Update IVsCodeServicePort interface
cat << 'EOF' > shared/services/vscode/domain/port-out/vscode-service.port.ts
import { LogLevel } from '../model/types';
import { VsCodeSettings } from '../model/VsCodeSettings.gen';

export interface IVsCodeServicePort {
    logMessage(level: LogLevel, message: string, details?: any): Promise<void>;
    getExtentionSettings(): Promise<VsCodeSettings>;
    openUrl(url: string, inExternalBrowser: boolean): Promise<void>;
    revealInExplorer(targetPath: string): Promise<void>;
}
EOF

# 2. Update RpcMethodEnum to register VSCODE_REVEAL_IN_EXPLORER
cat << 'EOF' > shared/config/rpc-methods.enum.gen.ts
export enum RpcMethodEnum {
    INSTALLER_CHECK_INSTALLATION_STATUS = 'INSTALLER_CHECK_INSTALLATION_STATUS',
    INSTALLER_UNINSTALL_ALL = 'INSTALLER_UNINSTALL_ALL',
    NEO4J_EXECUTE_CYPHER = 'NEO4J_EXECUTE_CYPHER',
    NEO4J_GET_PATHS_CHANGE_IMPACTS = 'NEO4J_GET_PATHS_CHANGE_IMPACTS',
    VSCODE_LOG_MESSAGE = 'VSCODE_LOG_MESSAGE',
    VSCODE_GET_EXTENTION_SETTINGS = 'VSCODE_GET_EXTENTION_SETTINGS',
    VSCODE_OPEN_URL = 'VSCODE_OPEN_URL',
    VSCODE_REVEAL_IN_EXPLORER = 'VSCODE_REVEAL_IN_EXPLORER',
}
EOF

# 3. Update VsCodeServiceAdapter with revealInExplorer implementation and .class -> .java resolution
cat << 'EOF' > backend/src/services/vscode/vscode-service.adapter.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { IVsCodeServicePort } from '../../../../shared/services/vscode/domain/port-out/vscode-service.port';
import { LogLevel } from '../../../../shared/services/vscode/domain/model/types';
import { VsCodeSettings } from '../../../../shared/services/vscode/domain/model/VsCodeSettings.gen';
import { vsCodeSettingsManager } from '../../managers/VsCodeSettings.manager';
import { logInfo, logWarn, logError } from '../../utils/utils-log';
import { getWorkspaceRoot } from '../../utils/utils-vscode';

export class VsCodeServiceAdapter implements IVsCodeServicePort {
    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        if (level === 'ERROR') {
            logError(message, details);
        } else if (level === 'WARN') {
            logWarn(message, details);
        } else {
            logInfo(`[${level}] ${message}`, details);
        }
    }

    public async getExtentionSettings(): Promise<VsCodeSettings> {
        return vsCodeSettingsManager.getSettings();
    }

    public async openUrl(url: string, inExternalBrowser: boolean): Promise<void> {
        if (url) {
            const uri = vscode.Uri.parse(url);
            if (inExternalBrowser) {
                await vscode.env.openExternal(uri);
            } else {
                await vscode.commands.executeCommand('vscode.open', uri);
            }
        }
    }

    public async revealInExplorer(targetPath: string): Promise<void> {
        logInfo(`[VsCodeServiceAdapter] revealInExplorer invoked with path: ${targetPath}`);
        try {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            const rootPath = workspaceFolders && workspaceFolders.length > 0 ? workspaceFolders[0].uri.fsPath : getWorkspaceRoot();
            let fullPath = targetPath;

            if (!path.isAbsolute(fullPath) && rootPath) {
                fullPath = path.join(rootPath, fullPath);
            }

            // Translate compiled .class files to source .java files
            fullPath = this.resolveSourceFilePath(fullPath);

            if (fs.existsSync(fullPath)) {
                logInfo(`[VsCodeServiceAdapter] Revealing file in VS Code Explorer: ${fullPath}`);
                const uri = vscode.Uri.file(fullPath);
                await vscode.commands.executeCommand('revealInExplorer', uri);
                const doc = await vscode.workspace.openTextDocument(uri);
                await vscode.window.showTextDocument(doc, { preview: true, preserveFocus: true });
            } else {
                logWarn(`[VsCodeServiceAdapter] Resolved file path does not exist: ${fullPath}`);
            }
        } catch (err) {
            logError(`[VsCodeServiceAdapter] Failed to reveal file in explorer: ${err}`);
        }
    }

    private resolveSourceFilePath(filePath: string): string {
        if (!filePath.endsWith('.class')) {
            return filePath;
        }

        // 1. Remove inner class suffix ($1, $SubClass, etc.) and convert extension
        let javaPath = filePath.replace(/\$[^/]+\.class$/, '.class').replace(/\.class$/, '.java');

        // 2. Map target/build output paths back to source directories
        const replacements = [
            { from: '/target/classes/', to: '/src/main/java/' },
            { from: '/target/test-classes/', to: '/src/test/java/' },
            { from: '/build/classes/java/main/', to: '/src/main/java/' },
            { from: '/build/classes/java/test/', to: '/src/test/java/' },
            { from: '/out/production/', to: '/src/' }
        ];

        for (const { from, to } of replacements) {
            if (javaPath.includes(from)) {
                const candidate = javaPath.replace(from, to);
                if (fs.existsSync(candidate)) {
                    return candidate;
                }
            }
        }

        if (fs.existsSync(javaPath)) {
            return javaPath;
        }

        return filePath;
    }
}

export const vsCodeServiceAdapter = new VsCodeServiceAdapter();
EOF

# 4. Register VSCODE_REVEAL_IN_EXPLORER in rpc-method-registrator.gen.ts
cat << 'EOF' > backend/src/config/rpc-method-registrator.gen.ts
import { RpcProtocol } from '../../shared/rpc/rpc-protocol';
import { RpcMethodEnum } from '../../shared/config/rpc-methods.enum.gen';
import { vsCodeServiceAdapter } from '../services/vscode/vscode-service.adapter';

export function registerRpcMethods(rpc: RpcProtocol): void {
    rpc.register(RpcMethodEnum.VSCODE_LOG_MESSAGE, (level, message, details) => vsCodeServiceAdapter.logMessage(level, message, details));
    rpc.register(RpcMethodEnum.VSCODE_GET_EXTENTION_SETTINGS, () => vsCodeServiceAdapter.getExtentionSettings());
    rpc.register(RpcMethodEnum.VSCODE_OPEN_URL, (url, inExternalBrowser) => vsCodeServiceAdapter.openUrl(url, inExternalBrowser));
    rpc.register(RpcMethodEnum.VSCODE_REVEAL_IN_EXPLORER, (targetPath) => vsCodeServiceAdapter.revealInExplorer(targetPath));
}
EOF

# 5. Update vs-code-api.service.gen.ts
cat << 'EOF' > webview/src/services/api/vs-code-api.service.gen.ts
// AUTO-GENERATED FILE. DO NOT EDIT DIRECTLY.
// Rebuild using: npm run generate:webview-api-services

import { RpcMethodEnum } from '@/shared/config/rpc-methods.enum.gen';
import { AbstractApiService } from './abstract-api.service';
import { LogLevel } from '@/shared/services/vscode/domain/model/types';
import { VsCodeSettings } from '@/shared/services/vscode/domain/model/VsCodeSettings.gen';
import { IVsCodeServicePort } from '@/shared/services/vscode/domain/port-out/vscode-service.port';

class VsCodeApiService extends AbstractApiService implements IVsCodeServicePort {
    constructor() {
        super();
    }

    public async logMessage(level: LogLevel, message: string, details?: any): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_LOG_MESSAGE, level, message, details);
    }

    public async getExtentionSettings(): Promise<VsCodeSettings> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_GET_EXTENTION_SETTINGS);
    }

    public async openUrl(url: string, inExternalBrowser: boolean): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_OPEN_URL, url, inExternalBrowser);
    }

    public async revealInExplorer(targetPath: string): Promise<void> {
        return await this.rpc.call(RpcMethodEnum.VSCODE_REVEAL_IN_EXPLORER, targetPath);
    }
}

export const vsCodeApiService = new VsCodeApiService();
EOF

# 6. Update ExplorerFeature.tsx to call vsCodeApiService.revealInExplorer
cat << 'EOF' > webview/src/features/explorer/ExplorerFeature.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';

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

  const handleNodeDoubleClick = useCallback((nodeId: string) => {
    const targetFile = codebase.files.find((f) => f.id === nodeId);
    if (targetFile && targetFile.path) {
      logInfo(`Double-clicked graph item: ${nodeId}. Revealing path in VS Code Explorer: ${targetFile.path}`);
      vsCodeApiService.revealInExplorer(targetFile.path);
    }
  }, [codebase.files]);

  // Reveal corresponding file in VS Code File Explorer upon single-click selection
  useEffect(() => {
    if (!selectedEntity) return;
    const targetFile = codebase.files.find((f) => f.id === selectedEntity.nodeId);
    if (targetFile && targetFile.path) {
      vsCodeApiService.revealInExplorer(targetFile.path);
    }
  }, [selectedEntity, codebase.files]);

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick
  );

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
    handleNodeDoubleClick,
    containerRef,
    cyRef,
    isDarkMode,
    graphState,
  ]);

  return null;
}

export default ExplorerFeature;
EOF

echo "✅ fix: Registered VSCODE_REVEAL_IN_EXPLORER RPC method and added Java .class -> .java source resolution!"

# Rebuild project
npm run build

#!/usr/bin/env bash
set -euo pipefail

# Ensure target directories exist
mkdir -p webview/src/features/explorer/wkp-top-impacted-paths/hooks
mkdir -p webview/src/features/explorer/wkp-top-impacted-paths
mkdir -p webview/src/features/explorer/layout-ctns

# 1. Update use-impacted-paths.ts to fix depth resetting and build Default Cypher query params from store
cat << 'EOF' > webview/src/features/explorer/wkp-top-impacted-paths/hooks/use-impacted-paths.ts
// webview/src/features/explorer/wkp-top-impacted-paths/hooks/use-impacted-paths.ts
import { useEffect, useCallback, useRef } from 'react';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '../../store/useExplorerStore';

export interface UseImpactedPathsOptions {
  defaultCodebase?: CodebaseData;
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function useImpactedPaths(options: UseImpactedPathsOptions = {}) {
  const {
    onCodebaseChange,
    upstreamDepth: propUpstreamDepth,
    downstreamDepth: propDownstreamDepth,
  } = options;

  const currentPath = useExplorerStore((s) => s.currentPath);
  const setCurrentPath = useExplorerStore((s) => s.setCurrentPath);
  const pathsList = useExplorerStore((s) => s.pathsList);
  const setPathsList = useExplorerStore((s) => s.setPathsList);
  const codebaseData = useExplorerStore((s) => s.codebase);
  const setCodebaseData = useExplorerStore((s) => s.setCodebase);
  const paths = useExplorerStore((s) => s.paths);
  const setPaths = useExplorerStore((s) => s.setPaths);

  const internalUpstreamDepth = useExplorerStore((s) => s.upstreamDepth);
  const setInternalUpstreamDepth = useExplorerStore((s) => s.setUpstreamDepth);
  const internalDownstreamDepth = useExplorerStore((s) => s.downstreamDepth);
  const setInternalDownstreamDepth = useExplorerStore((s) => s.setDownstreamDepth);

  // Sync prop changes ONLY if prop is explicitly defined and differs from internal store
  useEffect(() => {
    if (propUpstreamDepth !== undefined && propUpstreamDepth !== internalUpstreamDepth) {
      setInternalUpstreamDepth(propUpstreamDepth);
    }
  }, [propUpstreamDepth, internalUpstreamDepth, setInternalUpstreamDepth]);

  useEffect(() => {
    if (propDownstreamDepth !== undefined && propDownstreamDepth !== internalDownstreamDepth) {
      setInternalDownstreamDepth(propDownstreamDepth);
    }
  }, [propDownstreamDepth, internalDownstreamDepth, setInternalDownstreamDepth]);

  const effectiveUpstreamDepth = propUpstreamDepth !== undefined ? propUpstreamDepth : internalUpstreamDepth;
  const effectiveDownstreamDepth = propDownstreamDepth !== undefined ? propDownstreamDepth : internalDownstreamDepth;

  const depthRef = useRef({
    upstreamDepth: effectiveUpstreamDepth,
    downstreamDepth: effectiveDownstreamDepth,
  });

  useEffect(() => {
    depthRef.current = {
      upstreamDepth: effectiveUpstreamDepth,
      downstreamDepth: effectiveDownstreamDepth,
    };
  }, [effectiveUpstreamDepth, effectiveDownstreamDepth]);

  const updatePath = useCallback(
    (newPath: string) => {
      setCurrentPath(newPath);
      setPathsList((prev) => (prev.includes(newPath) ? prev : [...prev, newPath]));
    },
    [setCurrentPath, setPathsList]
  );

  const fetchImpacts = useCallback(
    async (
      targetPaths: string,
      up = depthRef.current.upstreamDepth,
      down = depthRef.current.downstreamDepth
    ) => {
      if (!targetPaths.trim()) return;
      logInfo(`[useImpactedPaths] Fetching impacts for paths with upstreamDepth=${up}, downstreamDepth=${down}`);
      const realCodebaseData = await getPathsChangeImpacts(targetPaths, up, down);

      if (realCodebaseData) {
        setCodebaseData(realCodebaseData);
        if (onCodebaseChange) {
          onCodebaseChange(realCodebaseData);
        }
      }
    },
    [onCodebaseChange, setCodebaseData]
  );

  const handlePathsChange = useCallback(
    (newPaths: string) => {
      setPaths(newPaths);
      updatePath(newPaths);
      fetchImpacts(newPaths, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
    },
    [setPaths, updatePath, fetchImpacts]
  );

  const buildDefaultCypherQueryParameters = useCallback(async () => {
    const currentStoreState = useExplorerStore.getState();
    const activePaths = currentStoreState.paths || '';
    const activeUpstream = currentStoreState.upstreamDepth;
    const activeDownstream = currentStoreState.downstreamDepth;

    const formattedTargetPath = activePaths.trim()
      ? activePaths.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
      : '???';

    const cypherParams = `:param {
  targetPath: "${formattedTargetPath}",
  upstreamDepth: "${activeUpstream}",
  downstreamDepth: "${activeDownstream}"
}`;

    logInfo(`[useImpactedPaths] Cypher parameters generated:\n${cypherParams}`);
    await vsCodeApiService.copyToClipboard(cypherParams);
  }, []);

  const appendOrReplacePath = useCallback(
    (newPath: string) => {
      setPaths((prev) => {
        let updated = newPath.trim();
        if (prev.trim()) {
          const existingLines = prev.split('\n').map((l) => l.trim()).filter(Boolean);
          if (!existingLines.includes(newPath.trim())) {
            updated = `${newPath.trim()}\n${prev.trim()}`;
          } else {
            updated = prev;
          }
        }
        updatePath(updated);
        fetchImpacts(updated, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
        return updated;
      });
    },
    [setPaths, updatePath, fetchImpacts]
  );

  const setUpstreamDepth = useCallback(
    (val: number) => {
      setInternalUpstreamDepth(val);
      if (paths.trim()) {
        fetchImpacts(paths, val, depthRef.current.downstreamDepth);
      }
    },
    [paths, fetchImpacts, setInternalUpstreamDepth]
  );

  const setDownstreamDepth = useCallback(
    (val: number) => {
      setInternalDownstreamDepth(val);
      if (paths.trim()) {
        fetchImpacts(paths, depthRef.current.upstreamDepth, val);
      }
    },
    [paths, fetchImpacts, setInternalDownstreamDepth]
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (paths.trim()) {
      fetchImpacts(paths, effectiveUpstreamDepth, effectiveDownstreamDepth);
    }
  }, [effectiveUpstreamDepth, effectiveDownstreamDepth, fetchImpacts, paths]);

  useEffect(() => {
    const unsubscribeStatus = vsCodeHandleMessage.on('selectedPath', (message) => {
      logInfo(`[useImpactedPaths] selectedPath event received: ${message.payload}`);
      if (message.payload) {
        handlePathsChange(message.payload);
      }
    });

    const unsubscribeAddPath = vsCodeHandleMessage.on('addPathToTop', (message) => {
      logInfo(`[useImpactedPaths] addPathToTop event received: ${message.payload}`);
      if (message.payload) {
        appendOrReplacePath(message.payload);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeAddPath();
    };
  }, [handlePathsChange, appendOrReplacePath]);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handlePathsChange(e.target.value);
    },
    [handlePathsChange]
  );

  return {
    paths,
    currentPath,
    pathsList,
    codebaseData,
    upstreamDepth: effectiveUpstreamDepth,
    downstreamDepth: effectiveDownstreamDepth,
    setUpstreamDepth,
    setDownstreamDepth,
    updatePath,
    setCodebaseData,
    handleTextareaChange,
    handlePathsChange,
    appendOrReplacePath,
    fetchImpacts,
    buildDefaultCypherQueryParameters,
  };
}
EOF

# 2. Update ImpactedPathsPanelHeader.tsx to handle numeric input changes without state loss
cat << 'EOF' > webview/src/features/explorer/wkp-top-impacted-paths/ImpactedPathsPanelHeader.tsx
// webview/src/features/explorer/wkp-top-impacted-paths/ImpactedPathsPanelHeader.tsx
import React from 'react';
import { ArrowUp, ArrowDown, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface ImpactedPathsPanelHeaderLeftProps {
  title?: string;
}

export const ImpactedPathsPanelHeaderLeft: React.FC<ImpactedPathsPanelHeaderLeftProps> = ({
  title = 'Impacted Paths to analyze',
}) => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate uppercase tracking-wider">
      {title}
    </span>
  </div>
);

export interface ImpactedPathsPanelHeaderCenterProps {
  upstreamDepth: number;
  setUpstreamDepth: (val: number) => void;
  downstreamDepth: number;
  setDownstreamDepth: (val: number) => void;
}

export const ImpactedPathsPanelHeaderCenter: React.FC<ImpactedPathsPanelHeaderCenterProps> = ({
  upstreamDepth,
  setUpstreamDepth,
  downstreamDepth,
  setDownstreamDepth,
}) => {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <ArrowUp size={12} className="text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Upstream Depth:
        </span>
        <Input
          id="input-upstream-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent shadow-none p-0 border-0 focus-visible:ring-0 focus:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={upstreamDepth}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            setUpstreamDepth(isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed)));
          }}
        />
      </div>
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <ArrowDown size={12} className="text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Downstream Depth:
        </span>
        <Input
          id="input-downstream-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent shadow-none p-0 border-0 focus-visible:ring-0 focus:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={downstreamDepth}
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            setDownstreamDepth(isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed)));
          }}
        />
      </div>
    </div>
  );
};

export interface ImpactedPathsPanelHeaderRightProps {
  onBuildDefaultQueryParameters?: () => void;
}

export const ImpactedPathsPanelHeaderRight: React.FC<ImpactedPathsPanelHeaderRightProps> = ({
  onBuildDefaultQueryParameters,
}) => {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onBuildDefaultQueryParameters}
        className="hover:bg-muted/50 p-1 rounded-sm text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
        title="Build default Cypher query"
      >
        <Database size={16} />
      </button>
    </div>
  );
};

export interface ImpactedPathsPanelHeaderProps extends ImpactedPathsPanelHeaderCenterProps {
  title?: string;
  onBuildDefaultQueryParameters?: () => void;
}

export const ImpactedPathsPanelHeader: React.FC<ImpactedPathsPanelHeaderProps> = ({
  title,
  upstreamDepth,
  setUpstreamDepth,
  downstreamDepth,
  setDownstreamDepth,
  onBuildDefaultQueryParameters,
}) => {
  return (
    <div className="flex justify-between items-center px-2 py-1 w-full">
      <ImpactedPathsPanelHeaderLeft title={title} />
      <ImpactedPathsPanelHeaderCenter
        upstreamDepth={upstreamDepth}
        setUpstreamDepth={setUpstreamDepth}
        downstreamDepth={downstreamDepth}
        setDownstreamDepth={setDownstreamDepth}
      />
      <ImpactedPathsPanelHeaderRight onBuildDefaultQueryParameters={onBuildDefaultQueryParameters} />
    </div>
  );
};

export default ImpactedPathsPanelHeader;
EOF

# 3. Update TopPanelContainer.tsx to ensure Cypher params copy exact active paths and depth
cat << 'EOF' > webview/src/features/explorer/layout-ctns/TopPanelContainer.tsx
// webview/src/features/explorer/layout-ctns/TopPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { ImpactedPathsPanel } from '../wkp-top-impacted-paths/impacted-paths-panel';
import {
  ImpactedPathsPanelHeaderLeft,
  ImpactedPathsPanelHeaderCenter,
  ImpactedPathsPanelHeaderRight,
} from '../wkp-top-impacted-paths/ImpactedPathsPanelHeader';
import { useExplorerStore } from '../store/useExplorerStore';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function TopPanelContainer() {
  const upstreamDepth = useExplorerStore((s) => s.upstreamDepth);
  const setUpstreamDepth = useExplorerStore((s) => s.setUpstreamDepth);
  const downstreamDepth = useExplorerStore((s) => s.downstreamDepth);
  const setDownstreamDepth = useExplorerStore((s) => s.setDownstreamDepth);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  const handleBuildDefaultQueryParameters = useCallback(async () => {
    const currentStoreState = useExplorerStore.getState();
    const activePaths = currentStoreState.paths || '';
    const activeUpstream = currentStoreState.upstreamDepth;
    const activeDownstream = currentStoreState.downstreamDepth;

    const formattedTargetPath = activePaths.trim()
      ? activePaths
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)
          .join('\n')
      : '???';

    const cypherParams = `:param {
  targetPath: "${formattedTargetPath}",
  upstreamDepth: "${activeUpstream}",
  downstreamDepth: "${activeDownstream}"
}`;

    logInfo(`[TopPanelContainer] Cypher parameters generated:\n${cypherParams}`);
    await vsCodeApiService.copyToClipboard(cypherParams);
    setNotification('Default Cypher parameters copied to clipboard!');
  }, [setNotification]);

  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.top"
        headerLeft={<ImpactedPathsPanelHeaderLeft />}
        headerCenter={
          <ImpactedPathsPanelHeaderCenter
            upstreamDepth={upstreamDepth}
            setUpstreamDepth={setUpstreamDepth}
            downstreamDepth={downstreamDepth}
            setDownstreamDepth={setDownstreamDepth}
          />
        }
        headerRight={
          <ImpactedPathsPanelHeaderRight
            onBuildDefaultQueryParameters={handleBuildDefaultQueryParameters}
          />
        }
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <ImpactedPathsPanel
          onCodebaseChange={handleImportCodebase}
          upstreamDepth={upstreamDepth}
          downstreamDepth={downstreamDepth}
        />
      </div>
    </div>
  );
}
EOF

echo "✅ fix: Resolved depth input state resets and ensured targetPath parameter includes active textArea content!"

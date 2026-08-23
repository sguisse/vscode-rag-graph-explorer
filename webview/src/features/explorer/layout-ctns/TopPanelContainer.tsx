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
import { useImpactedPaths } from '../wkp-top-impacted-paths/hooks/use-impacted-paths';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function TopPanelContainer() {
  const upstreamDepth = useExplorerStore((s) => s.upstreamDepth);
  const setUpstreamDepth = useExplorerStore((s) => s.setUpstreamDepth);
  const downstreamDepth = useExplorerStore((s) => s.downstreamDepth);
  const setDownstreamDepth = useExplorerStore((s) => s.setDownstreamDepth);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const { buildDefaultCypherQueryParameters } = useImpactedPaths();

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

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
            onBuildDefaultQueryParameters={buildDefaultCypherQueryParameters}
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

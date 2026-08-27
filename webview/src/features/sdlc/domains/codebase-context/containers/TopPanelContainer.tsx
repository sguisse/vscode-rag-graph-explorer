import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { ImpactedPathsPanel } from '../components/impacted-paths/impacted-paths-panel';
import {
  ImpactedPathsPanelHeaderLeft,
  ImpactedPathsPanelHeaderCenter,
  ImpactedPathsPanelHeaderRight,
} from '../components/impacted-paths/ImpactedPathsPanelHeader';
import { useCodebaseDomainState } from '../store/useCodebaseDomainState';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function TopPanelContainer() {
  const upstreamDepth = useCodebaseDomainState((s) => s.upstreamDepth);
  const setUpstreamDepth = useCodebaseDomainState((s) => s.setUpstreamDepth);
  const downstreamDepth = useCodebaseDomainState((s) => s.downstreamDepth);
  const setDownstreamDepth = useCodebaseDomainState((s) => s.setDownstreamDepth);
  const setCodebase = useCodebaseDomainState((s) => s.setCodebase);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  const handleBuildDefaultQueryParameters = useCallback(async () => {
    const currentStoreState = useCodebaseDomainState.getState();
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

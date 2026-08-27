#!/usr/bin/env bash
set -e

echo "🚀 Updating Zoom In (+) and Zoom Out (-) handlers to recenter graph canvas..."

# Ensure target directory exists
mkdir -p webview/src/features/sdlc/domains/codebase-context/components/dependency-graph/hooks

# -----------------------------------------------------------------------------
# Update use-graph-panel-header.ts: Add cyRef.current.center() to handleZoomIn and handleZoomOut
# -----------------------------------------------------------------------------
cat << 'EOF' > webview/src/features/sdlc/domains/codebase-context/components/dependency-graph/hooks/use-graph-panel-header.ts
import React from 'react';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vscodeSettings } from '@/App';
import { useCodebaseDomainState } from '@/features/sdlc/domains/codebase-context/store/useCodebaseDomainState';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

export function useGraphPanelHeader(propCyRef?: React.RefObject<any>) {
  const currentLayout = useCodebaseDomainState((s) => s.currentLayout);
  const setCurrentLayout = useCodebaseDomainState((s) => s.setCurrentLayout);

  const currentRendering = useCodebaseDomainState((s) => s.graphRendering) || 'uml';
  const setGraphRendering = useCodebaseDomainState((s) => s.setGraphRendering);
  const storeCyRef = useCodebaseDomainState((s) => s.cyRef);
  const toggleAutoFit = useCodebaseDomainState((s) => s.toggleAutoFit);

  const cyRef = propCyRef || storeCyRef;

  const setCurrentRendering = (val: GraphRendering) => {
    if (setGraphRendering) {
      setGraphRendering(val);
    }
  };

  const displayNeo4jHandler = () => {
    vsCodeApiService.openUrl(vscodeSettings.graphRagExplorer.neo4j.url, true);
  };

  const handleZoomIn = () => {
    if (cyRef?.current) {
      cyRef.current.zoom((cyRef.current.zoom() || 1) * 1.2);
      cyRef.current.center();
    }
  };

  const handleZoomOut = () => {
    if (cyRef?.current) {
      cyRef.current.zoom((cyRef.current.zoom() || 1) / 1.2);
      cyRef.current.center();
    }
  };

  const handleFitView = (e?: React.MouseEvent | MouseEvent) => {
    const evt = e || (window.event as MouseEvent | undefined);
    if (evt?.metaKey || evt?.ctrlKey) {
      evt.preventDefault?.();
      evt.stopPropagation?.();
      toggleAutoFit();
      return;
    }
    if (cyRef?.current) {
      cyRef.current.fit(undefined, 40);
      cyRef.current.center();
    }
  };

  return {
    currentLayout,
    setCurrentLayout,
    currentRendering,
    setCurrentRendering,
    displayNeo4jHandler,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
  };
}
EOF

echo "✅ feat/fix: Configured Zoom In (+) and Zoom Out (-) actions to automatically recenter graph viewport on canvas!"
echo "💡 Next step: Run 'npm run build' to re-verify build cleanliness."

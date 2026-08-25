import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vscodeSettings } from '@/App';
import { useExplorerStore } from '@/features/sdlc/domains/codebase-context/store/useCodebaseDomainState';
import { GraphRendering } from '@/shared/services/graph-rag-explorer/domain/model/types/type-graph-rendering';

export function useGraphPanelHeader(cyRef?: React.RefObject<any>) {
  const currentLayout = useExplorerStore((s) => s.currentLayout);
  const setCurrentLayout = useExplorerStore((s) => s.setCurrentLayout);

  const currentRendering = useExplorerStore((s) => s.graphRendering) || 'uml';
  const setGraphRendering = useExplorerStore((s) => s.setGraphRendering);

  const setCurrentRendering = (val: GraphRendering) => {
    if (setGraphRendering) {
      setGraphRendering(val);
    }
  };

  const displayNeo4jHandler = () => {
    vsCodeApiService.openUrl(vscodeSettings.graphRagExplorer.neo4j.url, true);
  };

  const handleZoomIn = () => {
    cyRef?.current?.zoom((cyRef.current?.zoom() || 1) * 1.2);
  };

  const handleZoomOut = () => {
    cyRef?.current?.zoom((cyRef.current?.zoom() || 1) / 1.2);
  };

  const handleFitView = () => {
    cyRef?.current?.fit(undefined, 40);
    cyRef?.current?.center();
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

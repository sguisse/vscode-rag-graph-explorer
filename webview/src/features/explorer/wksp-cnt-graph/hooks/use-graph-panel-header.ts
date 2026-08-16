import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vscodeSettings } from '@/App';

export function useGraphPanelHeader(cyRef?: React.RefObject<any>) {
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
    displayNeo4jHandler,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
  };
}

import { useCytoscapeInstance } from './useCytoscapeInstance';
import { useGraphTopology } from './useGraphTopology';

export function useGraph(
  isDarkMode: boolean,
  onNodeSelect: (nodeId: string) => void,
  onNodeDoubleClick?: (nodeId: string) => void,
  onNodeCmdClick?: (nodeId: string) => void
) {
  const { containerRef, cyRef, graphState, isReady } = useCytoscapeInstance(
    isDarkMode,
    onNodeSelect,
    onNodeDoubleClick,
    onNodeCmdClick
  );
  const { updateGraphTopology } = useGraphTopology(cyRef);

  return { containerRef, cyRef, graphState, updateGraphTopology, isReady };
}

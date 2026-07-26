import { useCytoscapeInstance } from './useCytoscapeInstance';
import { useGraphTopology } from './useGraphTopology';

export function useGraph(isDarkMode: boolean, onNodeSelect: (nodeId: string) => void) {
  const { containerRef, cyRef, graphState, isReady } = useCytoscapeInstance(isDarkMode, onNodeSelect);
  const { updateGraphTopology } = useGraphTopology(cyRef);

  return { containerRef, cyRef, graphState, updateGraphTopology, isReady };
}

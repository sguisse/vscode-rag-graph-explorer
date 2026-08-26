import { useExplorerStore } from '@/features/explorer-old/store/useExplorerStore';

export function useGraphToolbar() {
  const maxNodesLimit = useExplorerStore((s) => s.maxNodesLimit);
  const setMaxNodesLimit = useExplorerStore((s) => s.setMaxNodesLimit);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const setCallersDepth = useExplorerStore((s) => s.setCallersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setCalleesDepth = useExplorerStore((s) => s.setCalleesDepth);
  const displayLevel = useExplorerStore((s) => s.displayLevel);
  const setDisplayLevel = useExplorerStore((s) => s.setDisplayLevel);

  return {
    maxNodesLimit,
    setMaxNodesLimit,
    callersDepth,
    setCallersDepth,
    calleesDepth,
    setCalleesDepth,
    displayLevel,
    setDisplayLevel,
  };
}

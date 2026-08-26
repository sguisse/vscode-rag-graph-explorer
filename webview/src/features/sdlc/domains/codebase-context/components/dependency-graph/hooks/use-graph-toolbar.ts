import { useCodebaseDomainState } from '@/features/sdlc/domains/codebase-context/store/useCodebaseDomainState';

export function useGraphToolbar() {
  const maxNodesLimit = useCodebaseDomainState((s) => s.maxNodesLimit);
  const setMaxNodesLimit = useCodebaseDomainState((s) => s.setMaxNodesLimit);
  const callersDepth = useCodebaseDomainState((s) => s.callersDepth);
  const setCallersDepth = useCodebaseDomainState((s) => s.setCallersDepth);
  const calleesDepth = useCodebaseDomainState((s) => s.calleesDepth);
  const setCalleesDepth = useCodebaseDomainState((s) => s.setCalleesDepth);
  const displayLevel = useCodebaseDomainState((s) => s.displayLevel);
  const setDisplayLevel = useCodebaseDomainState((s) => s.setDisplayLevel);

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

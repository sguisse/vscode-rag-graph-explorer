import { useState, useEffect } from 'react';
import { SelectedEntity, Dependency } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';

export function useTransitiveImpact(
  selectedEntity: SelectedEntity | null,
  dependencies: Dependency[],
  callersDepth: number = 1,
  calleesDepth: number = 1,
  enableDownstream: boolean = true,
  enableUpstream: boolean = false
) {
  const [impactedSet, setImpactedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const calculatedImpact = calculateTransitiveImpact(
      selectedEntity,
      dependencies,
      callersDepth,
      calleesDepth,
      enableDownstream,
      enableUpstream
    );
    setImpactedSet(calculatedImpact);
  }, [selectedEntity, dependencies, callersDepth, calleesDepth, enableDownstream, enableUpstream]);

  return { impactedSet, setImpactedSet };
}

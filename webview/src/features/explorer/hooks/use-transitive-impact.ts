import { useState, useEffect } from 'react';
import { SelectedEntity, ImpactDirection, Dependency } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';

export function useTransitiveImpact(
  selectedEntity: SelectedEntity | null,
  impactDirection: ImpactDirection,
  dependencies: Dependency[],
  callersDepth: number = 1,
  calleesDepth: number = 1
) {
  const [impactedSet, setImpactedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const targetDepth = impactDirection === 'caller' ? callersDepth : calleesDepth;
    const calculatedImpact = calculateTransitiveImpact(
      selectedEntity,
      impactDirection,
      dependencies,
      targetDepth
    );
    setImpactedSet(calculatedImpact);
  }, [selectedEntity, impactDirection, dependencies, callersDepth, calleesDepth]);

  return { impactedSet, setImpactedSet };
}

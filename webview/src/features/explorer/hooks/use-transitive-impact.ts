import { useState, useEffect } from 'react';
import { SelectedEntity, ImpactDirection, Dependency } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';


export function useTransitiveImpact(
  selectedEntity: SelectedEntity | null,
  impactDirection: ImpactDirection,
  dependencies: Dependency[]
) {
  const [impactedSet, setImpactedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const calculatedImpact = calculateTransitiveImpact(selectedEntity, impactDirection, dependencies);
    setImpactedSet(calculatedImpact);
  }, [selectedEntity, impactDirection, dependencies]);

  return { impactedSet, setImpactedSet };
}

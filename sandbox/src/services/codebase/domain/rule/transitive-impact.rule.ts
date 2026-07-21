import { SelectedEntity, ImpactDirection, Dependency } from '../model/codebase.model';

export function calculateTransitiveImpact(
  selectedEntity: SelectedEntity | null,
  impactDirection: ImpactDirection,
  dependencies: Dependency[]
): Set<string> {
  if (!selectedEntity) {
    return new Set<string>();
  }

  const visited = new Set<string>();
  const queue: string[] = [];

  const startKey = selectedEntity.type === 'member'
    ? `${selectedEntity.nodeId}__member__${selectedEntity.memberId}`
    : selectedEntity.nodeId;

  if (startKey) {
    queue.push(startKey);
    visited.add(startKey);
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    dependencies.forEach(dep => {
      const sourceKeyMember = `${dep.sourceNode}__member__${dep.sourceHandle}`;
      const targetKeyMember = `${dep.targetNode}__member__${dep.targetHandle}`;
      const sourceKey = dep.sourceHandle === 'header' ? dep.sourceNode : sourceKeyMember;
      const targetKey = dep.targetHandle === 'header' ? dep.targetNode : targetKeyMember;

      if (impactDirection === 'aval') {
        if (current === dep.sourceNode || current === sourceKey) {
          if (!visited.has(targetKey)) {
            visited.add(targetKey);
            visited.add(dep.targetNode);
            queue.push(targetKey);
          }
        }
      } else {
        if (current === dep.targetNode || current === targetKey) {
          if (!visited.has(sourceKey)) {
            visited.add(sourceKey);
            visited.add(dep.sourceNode);
            queue.push(sourceKey);
          }
        }
      }
    });
  }

  return visited;
}

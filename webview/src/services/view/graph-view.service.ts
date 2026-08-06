import { CodebaseFile, Dependency, ImpactDirection, MEMBER_KEY_SEPARATOR_TOKEN, SelectedEntity } from "@/shared/services/graph-rag-explorer";

function buildMemberKeyTokenSync(nodeId: string, memberId: string): string {
    return `${nodeId}${MEMBER_KEY_SEPARATOR_TOKEN}${memberId}`;
  }

export function buildMemberKeyToken(nodeId: string, memberId: string): string {
return buildMemberKeyTokenSync(nodeId, memberId);
}

export function isMemberKeyForFileToken(key: string, fileId: string): boolean {
return key.startsWith(`${fileId}${MEMBER_KEY_SEPARATOR_TOKEN}`);
}

export function extractMemberIdFromKeyToken(key: string): string {
return key.split(MEMBER_KEY_SEPARATOR_TOKEN)[1] || '';
}

export function calculateTransitiveImpact(
    selectedEntity: SelectedEntity | null,
    impactDirection: ImpactDirection,
    dependencies: Dependency[]
  ): Set<string> {
    if (!selectedEntity) return new Set<string>();

    const visited = new Set<string>();
    const queue: string[] = [];

    const startKey = selectedEntity.type === 'member' && selectedEntity.memberId
      ? buildMemberKeyTokenSync(selectedEntity.nodeId, selectedEntity.memberId)
      : selectedEntity.nodeId;

    if (startKey) {
      queue.push(startKey);
      visited.add(startKey);
    }

    while (queue.length > 0) {
      const current = queue.shift()!;
      dependencies.forEach(dep => {
        const sourceKeyMember = buildMemberKeyTokenSync(dep.sourceNode, dep.sourceHandle);
        const targetKeyMember = buildMemberKeyTokenSync(dep.targetNode, dep.targetHandle);
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


export function filterCodebaseFiles(
    files: CodebaseFile[],
    searchTerm: string,
    displayLevel: string,
    visibleFiles: Record<string, boolean>,
    maxNodesLimit: number
  ): CodebaseFile[] {
    return files.filter(file => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            file.path.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLevel = displayLevel === 'all' || file.type === displayLevel;
      return matchesSearch && visibleFiles[file.id] && matchesLevel;
    }).slice(0, maxNodesLimit);
  }

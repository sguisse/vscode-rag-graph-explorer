import { CodebaseData, CodebaseFile, Dependency, ImpactDirection, SelectedEntity } from "@/shared/services/graph-rag-explorer";
import { initialCodebase } from "@/features/explorer/wksp-cnt-graph/components/graph/GraphData";
import { MEMBER_KEY_SEPARATOR_TOKEN } from "@/shared/services/graph-rag-explorer/domain/model/codebase.constants";
import { logInfo } from "./log-view.service.wrapper";

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
    dependencies: Dependency[],
    maxDepth: number = 1
): Set<string> {
    if (!selectedEntity || maxDepth < 1) return new Set<string>();

    const visited = new Set<string>();
    const queue: Array<{ key: string; depth: number }> = [];

    const startKey = selectedEntity.type === 'member' && selectedEntity.memberId
      ? buildMemberKeyTokenSync(selectedEntity.nodeId, selectedEntity.memberId)
      : selectedEntity.nodeId;

    if (startKey) {
      queue.push({ key: startKey, depth: 0 });
      visited.add(startKey);
      visited.add(selectedEntity.nodeId);
    }

    while (queue.length > 0) {
      const { key: current, depth } = queue.shift()!;

      if (depth >= maxDepth) continue;

      dependencies.forEach(dep => {
        const depSourceNode = dep.sourceNode || dep.source;
        const depTargetNode = dep.targetNode || dep.target;
        const depSourceHandle = dep.sourceHandle || 'header';
        const depTargetHandle = dep.targetHandle || 'header';

        if (!depSourceNode || !depTargetNode) return;

        const sourceKeyMember = buildMemberKeyTokenSync(depSourceNode, depSourceHandle);
        const targetKeyMember = buildMemberKeyTokenSync(depTargetNode, depTargetHandle);
        const sourceKey = depSourceHandle === 'header' ? depSourceNode : sourceKeyMember;
        const targetKey = depTargetHandle === 'header' ? depTargetNode : targetKeyMember;

        if (impactDirection === 'callee') {
          if (current === depSourceNode || current === sourceKey || current === sourceKeyMember) {
            if (!visited.has(targetKey) || !visited.has(depTargetNode)) {
              visited.add(targetKey);
              visited.add(depTargetNode);
              queue.push({ key: targetKey, depth: depth + 1 });
            }
          }
        } else {
          if (current === depTargetNode || current === targetKey || current === targetKeyMember) {
            if (!visited.has(sourceKey) || !visited.has(depSourceNode)) {
              visited.add(sourceKey);
              visited.add(depSourceNode);
              queue.push({ key: sourceKey, depth: depth + 1 });
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

export function getPathsChangeImpacts(paths: string | string[]): CodebaseData {
    logInfo(`[getPathsChangeImpacts] Neo4j service is currently disabled. Returning initialCodebase as fallback.`);
    return initialCodebase;
}

export const getpathsChangeImpacts = getPathsChangeImpacts;

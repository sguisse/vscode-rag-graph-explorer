import { useMemo, useCallback } from 'react';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';
import { useCodebaseActions } from '../../../handlers/useCodebaseActions';

const VISIBILITY_ORDER = ['public', 'protected', 'package', 'private'];

export function useInspectorPanel(
  selectedEntity: SelectedEntity | null,
  initialCodebase: CodebaseData,
  handleCopy?: (text: string, message: string) => void
) {
  const { copyCypherQuery } = useCodebaseActions();

  const currentFile = useMemo(() => {
    if (!selectedEntity) return null;
    return initialCodebase?.files?.find((f: CodebaseFile) => f.id === selectedEntity.nodeId) || null;
  }, [selectedEntity, initialCodebase?.files]);

  const selectedMethod = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== 'member' || !currentFile) return null;
    return currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId) || null;
  }, [selectedEntity, currentFile]);

  const selectedProp = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== 'member' || !currentFile) return null;
    return currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId) || null;
  }, [selectedEntity, currentFile]);

  const groupedAttributes = useMemo(() => {
    if (!currentFile?.attributes || currentFile.attributes.length === 0) return {};
    const groups: Record<string, CodebaseAttribute[]> = {};
    currentFile.attributes.forEach((attr) => {
      const vis = attr.visibility || 'public';
      if (!groups[vis]) groups[vis] = [];
      groups[vis].push(attr);
    });
    return groups;
  }, [currentFile]);

  const sortedVisibilities = useMemo(() => {
    const keys = Object.keys(groupedAttributes);
    return keys.sort((a, b) => {
      const idxA = VISIBILITY_ORDER.indexOf(a);
      const idxB = VISIBILITY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [groupedAttributes]);

  const handleCopyFileCypherQuery = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedEntity) return;

    const nodeId = selectedEntity.nodeId;
    const simpleName = currentFile?.name
      ? currentFile.name.replace(/\.[^/.]+$/, '')
      : (nodeId.split('.').pop() || nodeId);

    const cypherQuery = `MATCH (t:Type)
  WHERE t.name = '${simpleName}'
  OPTIONAL MATCH (t)-[:WITH_SOURCE]->(f:File)
  OPTIONAL MATCH (t)-[:DECLARES]->(m:Member)
  OPTIONAL MATCH (t)-[r:DEPENDS_ON]->(dep:Type)
  RETURN t, f, m, r, dep;`;

    if (handleCopy) {
      handleCopy(cypherQuery, `Cypher query for '${simpleName}' copied to clipboard!`);
    } else {
      copyCypherQuery(cypherQuery, simpleName);
    }
  }, [selectedEntity, currentFile, handleCopy, copyCypherQuery]);

  const handleCopyMethodCypherQuery = useCallback((method: CodebaseMethod, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedEntity) return;

    const nodeId = selectedEntity.nodeId;
    const simpleName = currentFile?.name
      ? currentFile.name.replace(/\.[^/.]+$/, '')
      : (nodeId.split('.').pop() || nodeId);

    const methodCleanName = method.name.replace(/\(\)$/, '').replace(/\(.*\)$/, '');

    const cypherQuery = `MATCH (t:Type)-[:DECLARES]->(m:Member)
  WHERE (t.name = '${simpleName}')
  AND (m.name = '${methodCleanName}')
  OPTIONAL MATCH (m)-[r:INVOKES]->(callee:Method)
  OPTIONAL MATCH (caller:Method)-[inR:INVOKES]->(m)
  OPTIONAL MATCH (t)-[:WITH_SOURCE]->(f:File)
  RETURN t, m, r, callee, inR, caller, f;`;

    if (handleCopy) {
      handleCopy(cypherQuery, `Cypher query for method '${method.name}' in '${simpleName}' copied to clipboard!`);
    } else {
      copyCypherQuery(cypherQuery, `method ${method.name}`);
    }
  }, [selectedEntity, currentFile, handleCopy, copyCypherQuery]);

  return {
    currentFile,
    selectedMethod,
    selectedProp,
    groupedAttributes,
    sortedVisibilities,
    handleCopyFileCypherQuery,
    handleCopyMethodCypherQuery,
  };
}

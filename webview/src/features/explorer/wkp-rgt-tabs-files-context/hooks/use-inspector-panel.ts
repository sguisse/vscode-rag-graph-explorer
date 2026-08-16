import { useMemo } from 'react';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';

const VISIBILITY_ORDER = ['public', 'protected', 'package', 'private'];

export function useInspectorPanel(selectedEntity: SelectedEntity | null, initialCodebase: CodebaseData) {
  const currentFile = useMemo(() => {
    if (!selectedEntity) return null;
    return initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId) || null;
  }, [selectedEntity, initialCodebase.files]);

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

  return {
    currentFile,
    selectedMethod,
    selectedProp,
    groupedAttributes,
    sortedVisibilities,
  };
}

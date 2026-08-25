import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { CodebaseExplorerPanel } from '../wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useExplorerStore } from '../store/useExplorerStore';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function LeftPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const setFocusedNodeId = useExplorerStore((s) => s.setFocusedNodeId);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const filter = useCodebaseFilter(codebase.files);

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      setFocusedNodeId(nodeId);
      setTimeout(() => {
        setFocusedNodeId((prev) => (prev === nodeId ? null : prev));
      }, 2000);
    },
    [setFocusedNodeId]
  );

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-hidden">
        <CodebaseExplorerPanel
          codebase={codebase}
          searchFilteredFiles={filter.searchFilteredFiles}
          expandedFolders={filter.expandedFolders}
          visibleFiles={filter.visibleFiles}
          toggleFolder={filter.toggleFolder}
          toggleFolderCheckbox={filter.toggleFolderCheckbox}
          toggleFileCheckbox={filter.toggleFileCheckbox}
          setSelectedEntity={setSelectedEntity}
          onFocusNode={handleFocusNode}
          onImportCodebase={handleImportCodebase}
        />
      </div>
    </div>
  );
}

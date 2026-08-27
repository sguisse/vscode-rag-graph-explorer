import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/_layout/ContainerPanelHeader';
import { CodebaseExplorerPanel } from '../components/codebase-tree/CodebaseExplorerPanel';
import { useCodebaseDomainState } from '../store/useCodebaseDomainState';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function LeftPanelContainer() {
  const codebase = useCodebaseDomainState((s) => s.codebase);
  const setCodebase = useCodebaseDomainState((s) => s.setCodebase);
  const setSelectedEntity = useCodebaseDomainState((s) => s.setSelectedEntity);
  const setFocusedNodeId = useCodebaseDomainState((s) => s.setFocusedNodeId);
  const setNotification = useAppContextStore((s) => s.setNotification);

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
          setSelectedEntity={setSelectedEntity}
          onFocusNode={setFocusedNodeId}
          onImportCodebase={handleImportCodebase}
        />
      </div>
    </div>
  );
}

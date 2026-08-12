import React, { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { useContextPaths } from './use-context-paths';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

interface ContextPathsPanelProps {
  onCodebaseChange?: (codebase: CodebaseData) => void;
}

export function ContextPathsPanel({ onCodebaseChange }: ContextPathsPanelProps = {}) {
  const { currentPath, updatePath, setCodebaseData } = useContextPaths();
  const [paths, setPaths] = useState<string>(currentPath);

  // Helper function to handle async impact fetching
  const fetchImpacts = async (targetPaths: string) => {
    if (!targetPaths.trim()) return;
    const realCodebaseData = await getPathsChangeImpacts(targetPaths);

    // Update state or context with the real Neo4j data
    if (setCodebaseData) {
      setCodebaseData(realCodebaseData);
    }
    if (onCodebaseChange && realCodebaseData) {
      onCodebaseChange(realCodebaseData);
    }
  };

  useEffect(() => {
    // Register listener for 'selectedPath'
    const unsubscribeStatus = vsCodeHandleMessage.on('selectedPath', (message) => {
      logInfo(`Status received from extension: ${message.payload}`);
      if (message.payload) {
        setPaths((prev) => {
          const updated = prev ? `${prev}\n${message.payload}` : message.payload;
          updatePath(updated);
          fetchImpacts(updated);
          return updated;
        });
      }
    });

    // Cleanup event listeners on unmount
    return () => {
      unsubscribeStatus();
    };
  }, [updatePath]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPaths(val);
    updatePath(val);
    fetchImpacts(val);
  };

  return (
    <div className="flex flex-col bg-background p-0 w-full h-full">
      <Textarea
        value={paths}
        onChange={handleTextareaChange}
        placeholder="Selected paths from explorer..."
        className="bg-muted/20 border-border focus-visible:ring-1 w-full h-full min-h-[50px] font-mono text-foreground text-xs resize-none"
      />
    </div>
  );
}

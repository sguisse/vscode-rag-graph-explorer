import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { useContextPaths } from './use-context-paths';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

interface ContextPathsPanelProps {
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function ContextPathsPanel({
  onCodebaseChange,
  upstreamDepth = 2,
  downstreamDepth = 2,
}: ContextPathsPanelProps = {}) {
  const { currentPath, updatePath, setCodebaseData } = useContextPaths();
  const [paths, setPaths] = useState<string>(currentPath);

  // Keep fresh references of depths for effect callbacks
  const depthRef = useRef({ upstreamDepth, downstreamDepth });
  useEffect(() => {
    depthRef.current = { upstreamDepth, downstreamDepth };
  }, [upstreamDepth, downstreamDepth]);

  // Helper function to handle async impact fetching
  const fetchImpacts = useCallback(
    async (
      targetPaths: string,
      up = depthRef.current.upstreamDepth,
      down = depthRef.current.downstreamDepth
    ) => {
      if (!targetPaths.trim()) return;
      const realCodebaseData = await getPathsChangeImpacts(targetPaths, up, down);

      // Update state or context with the real Neo4j data
      if (setCodebaseData) {
        setCodebaseData(realCodebaseData);
      }
      if (onCodebaseChange && realCodebaseData) {
        onCodebaseChange(realCodebaseData);
      }
    },
    [setCodebaseData, onCodebaseChange]
  );

  // Trigger impacts fetch if depths change while target paths are active
  useEffect(() => {
    if (paths.trim()) {
      fetchImpacts(paths, upstreamDepth, downstreamDepth);
    }
  }, [upstreamDepth, downstreamDepth, fetchImpacts]);

  useEffect(() => {
    // Register listener for 'selectedPath'
    const unsubscribeStatus = vsCodeHandleMessage.on('selectedPath', (message) => {
      logInfo(`Status received from extension: ${message.payload}`);
      if (message.payload) {
        // Atomic update replacing Textarea content in one step
        const newPath = message.payload;
        setPaths(newPath);
        updatePath(newPath);
        fetchImpacts(newPath, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
      }
    });

    // Cleanup event listeners on unmount
    return () => {
      unsubscribeStatus();
    };
  }, [updatePath, fetchImpacts]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setPaths(val);
    updatePath(val);
    fetchImpacts(val, upstreamDepth, downstreamDepth);
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

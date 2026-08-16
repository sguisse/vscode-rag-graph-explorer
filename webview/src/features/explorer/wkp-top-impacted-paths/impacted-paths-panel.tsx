import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useImpactedPaths } from './hooks/use-impacted-paths';

interface ImpactedPathsPanelProps {
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function ImpactedPathsPanel({
  onCodebaseChange,
  upstreamDepth = 2,
  downstreamDepth = 2,
}: ImpactedPathsPanelProps = {}) {
  const {
    paths,
    handleTextareaChange,
  } = useImpactedPaths({
    onCodebaseChange,
    upstreamDepth,
    downstreamDepth,
  });

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

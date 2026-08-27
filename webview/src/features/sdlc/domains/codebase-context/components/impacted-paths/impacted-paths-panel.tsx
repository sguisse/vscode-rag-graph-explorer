import React, { useMemo } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useImpactedPaths } from './hooks/use-impacted-paths';
import { FilePathUI, buildFilePathUI } from './model/file-path-ui';

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

  const filePathUIList = useMemo<FilePathUI[]>(() => {
    if (!paths || !paths.trim()) return [];
    return paths
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => buildFilePathUI(line));
  }, [paths]);

  const displayPathsValue = useMemo(() => {
    return filePathUIList.map((item) => item.displayPath).join('\n');
  }, [filePathUIList]);

  return (
    <div className="flex flex-col bg-background p-0 w-full h-full min-h-0 overflow-hidden">
      <Textarea
        value={displayPathsValue || paths}
        onChange={handleTextareaChange}
        placeholder="Selected paths from explorer..."
        className="bg-muted/20 border-border focus-visible:ring-1 w-full h-full min-h-[50px] font-mono text-foreground text-xs resize-none"
      />
    </div>
  );
}

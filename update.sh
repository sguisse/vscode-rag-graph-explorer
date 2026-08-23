#!/usr/bin/env bash

set -e

echo "🚀 Connecting use-impacted-paths hook directly inside ImpactedPathsPanelHeader..."

cat << 'EOF' > webview/src/features/explorer/wkp-top-impacted-paths/ImpactedPathsPanelHeader.tsx
import React from 'react';
import { ArrowUp, ArrowDown, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useImpactedPaths } from './hooks/use-impacted-paths';

export interface ImpactedPathsPanelHeaderLeftProps {
  title?: string;
}

export const ImpactedPathsPanelHeaderLeft: React.FC<ImpactedPathsPanelHeaderLeftProps> = ({
  title = 'Impacted Paths to analyze',
}) => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate uppercase tracking-wider">
      {title}
    </span>
  </div>
);

export interface ImpactedPathsPanelHeaderCenterProps {
  upstreamDepth: number;
  setUpstreamDepth: (val: number) => void;
  downstreamDepth: number;
  setDownstreamDepth: (val: number) => void;
}

export const ImpactedPathsPanelHeaderCenter: React.FC<ImpactedPathsPanelHeaderCenterProps> = ({
  upstreamDepth,
  setUpstreamDepth,
  downstreamDepth,
  setDownstreamDepth,
}) => {
  return (
    <div className="flex items-center gap-3 font-mono text-xs">
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <ArrowUp size={12} className="text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Upstream Depth:
        </span>
        <Input
          id="input-upstream-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent shadow-none p-0 border-0 focus-visible:ring-0 focus:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={upstreamDepth}
          onChange={(e) => setUpstreamDepth(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm">
        <ArrowDown size={12} className="text-muted-foreground" />
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
          Downstream Depth:
        </span>
        <Input
          id="input-downstream-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent shadow-none p-0 border-0 focus-visible:ring-0 focus:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={downstreamDepth}
          onChange={(e) => setDownstreamDepth(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
};

export interface ImpactedPathsPanelHeaderRightProps {
  onCopyCypherParams?: (e: React.MouseEvent) => void;
}

export const ImpactedPathsPanelHeaderRight: React.FC<ImpactedPathsPanelHeaderRightProps> = ({
  onCopyCypherParams,
}) => (
  <div className="flex items-center gap-2">
    <Database
      className="w-3.5 h-3.5 text-amber-400 hover:text-amber-300 transition-colors cursor-pointer shrink-0"
      onClick={onCopyCypherParams}
      data-tooltip="Copy Neo4j Cypher parameters for the default query in 'backend/src/services/graph-rag-explorer/grag-explorer-service.adapter.ts'"
    />
  </div>
);

export interface ImpactedPathsPanelHeaderProps {
  title?: string;
  upstreamDepth?: number;
  setUpstreamDepth?: (val: number) => void;
  downstreamDepth?: number;
  setDownstreamDepth?: (val: number) => void;
  onCopyCypherParams?: (e: React.MouseEvent) => void;
}

export const ImpactedPathsPanelHeader: React.FC<ImpactedPathsPanelHeaderProps> = ({
  title,
  upstreamDepth: propUpstreamDepth,
  setUpstreamDepth: propSetUpstreamDepth,
  downstreamDepth: propDownstreamDepth,
  setDownstreamDepth: propSetDownstreamDepth,
  onCopyCypherParams: propOnCopyCypherParams,
}) => {
  const hookData = useImpactedPaths();

  const activeUpstreamDepth = propUpstreamDepth ?? hookData.upstreamDepth;
  const activeSetUpstreamDepth = propSetUpstreamDepth ?? hookData.setUpstreamDepth;
  const activeDownstreamDepth = propDownstreamDepth ?? hookData.downstreamDepth;
  const activeSetDownstreamDepth = propSetDownstreamDepth ?? hookData.setDownstreamDepth;
  const activeOnCopyCypherParams = propOnCopyCypherParams ?? hookData.handleCopyCypherQueryParameters;

  return (
    <div className="flex justify-between items-center px-2 py-1 w-full">
      <ImpactedPathsPanelHeaderLeft title={title} />
      <ImpactedPathsPanelHeaderCenter
        upstreamDepth={activeUpstreamDepth}
        setUpstreamDepth={activeSetUpstreamDepth}
        downstreamDepth={activeDownstreamDepth}
        setDownstreamDepth={activeSetDownstreamDepth}
      />
      <ImpactedPathsPanelHeaderRight onCopyCypherParams={activeOnCopyCypherParams} />
    </div>
  );
};

export default ImpactedPathsPanelHeader;
EOF

echo "✅ feat: ImpactedPathsPanelHeader now directly invokes handleCopyCypherQueryParameters from useImpactedPaths when clicking Database icon!"

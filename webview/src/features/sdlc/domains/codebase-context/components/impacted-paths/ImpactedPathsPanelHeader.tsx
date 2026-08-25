// webview/src/features/explorer/wkp-top-impacted-paths/ImpactedPathsPanelHeader.tsx
import React from 'react';
import { ArrowUp, ArrowDown, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            setUpstreamDepth(isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed)));
          }}
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
          onChange={(e) => {
            const parsed = parseInt(e.target.value, 10);
            setDownstreamDepth(isNaN(parsed) ? 0 : Math.max(0, Math.min(20, parsed)));
          }}
        />
      </div>
    </div>
  );
};

export interface ImpactedPathsPanelHeaderRightProps {
  onBuildDefaultQueryParameters?: () => void;
}

export const ImpactedPathsPanelHeaderRight: React.FC<ImpactedPathsPanelHeaderRightProps> = ({
  onBuildDefaultQueryParameters,
}) => {
  return (
    <div className="flex items-center">
      <button
        type="button"
        onClick={onBuildDefaultQueryParameters}
        className="hover:bg-muted/50 p-1 rounded-sm text-orange-500 hover:text-orange-600 transition-colors cursor-pointer"
        title="Build default Cypher query"
      >
        <Database size={16} />
      </button>
    </div>
  );
};

export interface ImpactedPathsPanelHeaderProps extends ImpactedPathsPanelHeaderCenterProps {
  title?: string;
  onBuildDefaultQueryParameters?: () => void;
}

export const ImpactedPathsPanelHeader: React.FC<ImpactedPathsPanelHeaderProps> = ({
  title,
  upstreamDepth,
  setUpstreamDepth,
  downstreamDepth,
  setDownstreamDepth,
  onBuildDefaultQueryParameters,
}) => {
  return (
    <div className="flex justify-between items-center px-2 py-1 w-full">
      <ImpactedPathsPanelHeaderLeft title={title} />
      <ImpactedPathsPanelHeaderCenter
        upstreamDepth={upstreamDepth}
        setUpstreamDepth={setUpstreamDepth}
        downstreamDepth={downstreamDepth}
        setDownstreamDepth={setDownstreamDepth}
      />
      <ImpactedPathsPanelHeaderRight onBuildDefaultQueryParameters={onBuildDefaultQueryParameters} />
    </div>
  );
};

export default ImpactedPathsPanelHeader;

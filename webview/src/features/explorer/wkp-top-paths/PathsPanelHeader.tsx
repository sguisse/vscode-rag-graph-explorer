import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';

export interface PathsPanelHeaderLeftProps {
  title?: string;
}

export const PathsPanelHeaderLeft: React.FC<PathsPanelHeaderLeftProps> = ({
  title = 'Context Paths',
}) => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate uppercase tracking-wider">
      {title}
    </span>
  </div>
);

export interface PathsPanelHeaderCenterProps {
  upstreamDepth: number;
  setUpstreamDepth: (val: number) => void;
  downstreamDepth: number;
  setDownstreamDepth: (val: number) => void;
}

export const PathsPanelHeaderCenter: React.FC<PathsPanelHeaderCenterProps> = ({
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
          className="bg-transparent shadow-none p-0 border-0 focus:ring-0 focus-visible:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
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
          className="bg-transparent shadow-none p-0 border-0 focus:ring-0 focus-visible:ring-0 w-8 h-5 font-bold text-foreground text-xs text-center"
          value={downstreamDepth}
          onChange={(e) => setDownstreamDepth(Number(e.target.value) || 0)}
        />
      </div>
    </div>
  );
};

export interface PathsPanelHeaderRightProps {}

export const PathsPanelHeaderRight: React.FC<PathsPanelHeaderRightProps> = () => null;

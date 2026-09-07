import React from 'react';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ExportPanelHeaderRightProps {
  onCollapseAll?: () => void;
  onExpandAll?: () => void;
}

export const ExportPanelHeaderRight: React.FC<ExportPanelHeaderRightProps> = ({
  onCollapseAll,
  onExpandAll,
}) => {
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <Button
        id="btn-collapse-all-exporter-cards"
        className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        variant="ghost"
        size="icon"
        onClick={onCollapseAll}
        data-tooltip="Collapse All Cards"
      >
        <ChevronsUp size={12} />
      </Button>
      <Button
        id="btn-expand-all-exporter-cards"
        className="hover:bg-muted rounded w-6 h-6 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        variant="ghost"
        size="icon"
        onClick={onExpandAll}
        data-tooltip="Expand All Cards"
      >
        <ChevronsDown size={12} />
      </Button>
    </div>
  );
};

export default ExportPanelHeaderRight;

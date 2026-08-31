import React from 'react';
import { Filter, FolderMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FinderBase, FinderBaseProps } from './FinderBase';
import type { FinderView } from './types';

export interface FinderTreeProps extends FinderBaseProps {
  isFilterActive?: boolean;
  setIsFilterActive?: (val: boolean) => void;
  collapseNotMatchingNodes?: boolean;
  setCollapseNotMatchingNodes?: (val: boolean) => void;
  styleView?: FinderView;
}

export const FinderTree: React.FC<FinderTreeProps> = ({
  isFilterActive,
  setIsFilterActive,
  collapseNotMatchingNodes = false,
  setCollapseNotMatchingNodes,
  styleView = 'toolbar',
  placeholder = 'Find in tree (Cmd+F)',
  ...props
}) => {
  const treeActions = (
    <>
      {setIsFilterActive && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Filter tree (Hide non-matching nodes)"
          aria-label="Filter tree"
          onClick={() => setIsFilterActive(!isFilterActive)}
          className={`w-6 h-6 p-0 rounded text-xs transition-colors cursor-pointer shrink-0 ${
            isFilterActive
              ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Filter size={13} />
        </Button>
      )}

      {setCollapseNotMatchingNodes && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          title="Collapse non-matching folders"
          aria-label="Collapse non-matching folders"
          onClick={() => setCollapseNotMatchingNodes(!collapseNotMatchingNodes)}
          className={`w-6 h-6 p-0 rounded text-xs transition-colors cursor-pointer shrink-0 ${
            collapseNotMatchingNodes
              ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <FolderMinus size={13} />
        </Button>
      )}
    </>
  );

  return (
    <FinderBase
      styleView={styleView}
      placeholder={placeholder}
      extraActions={treeActions}
      {...props}
    />
  );
};

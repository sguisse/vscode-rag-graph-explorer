import React from 'react';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FinderToggleOptionsProps {
  caseSensitive: boolean;
  setCaseSensitive: (val: boolean) => void;
  wholeWord: boolean;
  setWholeWord: (val: boolean) => void;
  useRegex: boolean;
  setUseRegex: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
}

export const FinderToggleOptions: React.FC<FinderToggleOptionsProps> = ({
  caseSensitive,
  setCaseSensitive,
  wholeWord,
  setWholeWord,
  useRegex,
  setUseRegex,
  searchQuery,
  setSearchQuery,
}) => (
  <div className="flex items-center gap-0.5 ml-1 text-muted-foreground shrink-0">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Match Case"
      title="Match Case (Aa)"
      onClick={() => setCaseSensitive(!caseSensitive)}
      className={`w-4 h-4 p-0 text-[10px] font-bold rounded-sm flex items-center justify-center transition-colors cursor-pointer ${
        caseSensitive
          ? 'bg-primary/20 text-primary border border-primary/40 font-extrabold'
          : 'hover:bg-muted hover:text-foreground'
      }`}
    >
      Aa
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Match Whole Word"
      title="Match Whole Word (W)"
      onClick={() => setWholeWord(!wholeWord)}
      className={`w-4 h-4 p-0 text-[10px] font-bold rounded-sm flex items-center justify-center transition-colors cursor-pointer ${
        wholeWord
          ? 'bg-primary/20 text-primary border border-primary/40 font-extrabold'
          : 'hover:bg-muted hover:text-foreground'
      }`}
    >
      W
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Use Regular Expression"
      title="Use Regular Expression (.*)"
      onClick={() => setUseRegex(!useRegex)}
      className={`w-4 h-4 p-0 text-[11px] font-mono rounded-sm flex items-center justify-center transition-colors cursor-pointer ${
        useRegex
          ? 'bg-primary/20 text-primary border border-primary/40 font-extrabold'
          : 'hover:bg-muted hover:text-foreground'
      }`}
    >
      .*
    </Button>

    {searchQuery && (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Clear Input"
        title="Clear Input"
        onClick={() => setSearchQuery('')}
        className="flex justify-center items-center hover:bg-muted ml-0.5 p-0 rounded-sm w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
      >
        <X size={12} />
      </Button>
    )}
  </div>
);

export interface FinderMatchCounterProps {
  currentMatchIndex: number;
  totalMatches: number;
}

export const FinderMatchCounter: React.FC<FinderMatchCounterProps> = ({
  currentMatchIndex,
  totalMatches,
}) => (
  <div className="px-1 min-w-[55px] font-sans font-medium text-[11px] text-muted-foreground text-center shrink-0">
    {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : 'No results'}
  </div>
);

export interface FinderNavigationProps {
  totalMatches: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export const FinderNavigation: React.FC<FinderNavigationProps> = ({
  totalMatches,
  onNext,
  onPrev,
  onClose,
}) => (
  <div className="flex items-center gap-0.5 pl-1 border-border border-l text-foreground shrink-0">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onPrev}
      disabled={totalMatches === 0}
      aria-label="Previous Match"
      title="Previous Match"
      className="flex justify-center items-center hover:bg-muted disabled:opacity-30 rounded w-5 h-5 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
    >
      <ChevronUp size={12} />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onNext}
      disabled={totalMatches === 0}
      aria-label="Next Match"
      title="Next Match"
      className="flex justify-center items-center hover:bg-muted disabled:opacity-30 rounded w-5 h-5 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
    >
      <ChevronDown size={12} />
    </Button>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClose}
      aria-label="Close Finder"
      title="Close Widget (Escape)"
      className="flex justify-center items-center hover:bg-muted rounded w-5 h-5 text-muted-foreground hover:text-foreground text-xs transition-colors cursor-pointer"
    >
      <X size={12} />
    </Button>
  </div>
);

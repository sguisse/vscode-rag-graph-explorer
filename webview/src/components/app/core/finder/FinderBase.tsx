import React, { useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  FinderToggleOptions,
  FinderMatchCounter,
  FinderNavigation,
} from './FinderCommon';
import { FinderView } from './model/types';

export interface FinderBaseProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  caseSensitive: boolean;
  setCaseSensitive: (val: boolean) => void;
  wholeWord: boolean;
  setWholeWord: (val: boolean) => void;
  useRegex: boolean;
  setUseRegex: (val: boolean) => void;
  styleView?: FinderView;
  focusTrigger?: number;
  currentMatchIndex: number;
  totalMatches: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  placeholder?: string;
  extraActions?: React.ReactNode;
}

export const FinderBase: React.FC<FinderBaseProps> = ({
  searchQuery,
  setSearchQuery,
  caseSensitive,
  setCaseSensitive,
  wholeWord,
  setWholeWord,
  useRegex,
  setUseRegex,
  styleView = 'toolbar',
  focusTrigger = 0,
  currentMatchIndex,
  totalMatches,
  onNext,
  onPrev,
  onClose,
  placeholder = 'Find (Cmd+F)',
  extraActions,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [focusTrigger]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        onPrev();
      } else {
        onNext();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const containerStyleClass =
    styleView === 'toolbar'
      ? 'p-1 px-2 border-b border-border shadow-none rounded-none w-full'
      : 'p-1.5 border border-border shadow-md rounded-md';

  return (
    <div
      role="search"
      aria-label="Find controller"
      className={`flex items-center gap-2 bg-muted/20 text-popover-foreground animate-fadeIn select-none font-sans text-xs ${containerStyleClass}`}
    >
      <div className="relative flex flex-1 items-center bg-background px-2 border border-input focus-within:border-ring rounded min-w-0 h-6 transition-colors">
        <Search size={13} className="mr-1.5 text-muted-foreground pointer-events-none shrink-0" />
        <Input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Search query"
          className="flex-1 shadow-none p-0 border-0 focus-visible:outline-none focus-visible:ring-0 min-w-0 h-full font-sans text-[12px] text-foreground md:text-[12px] placeholder:text-[12px] placeholder:text-muted-foreground"
          spellCheck={false}
        />

        <FinderToggleOptions
          caseSensitive={caseSensitive}
          setCaseSensitive={setCaseSensitive}
          wholeWord={wholeWord}
          setWholeWord={setWholeWord}
          useRegex={useRegex}
          setUseRegex={setUseRegex}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </div>

      {extraActions}

      <FinderMatchCounter
        currentMatchIndex={currentMatchIndex}
        totalMatches={totalMatches}
      />

      <FinderNavigation
        totalMatches={totalMatches}
        onNext={onNext}
        onPrev={onPrev}
        onClose={onClose}
      />
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Search, Pencil, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { FinderBase, FinderHtml, useTextareaFinder } from '@/components/app/core/finder';

interface InputPanelProps {
  inputText: string;
  setInputText: (val: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ inputText, setInputText }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const readOnlyContainerRef = useRef<HTMLDivElement>(null);

  const finder = useTextareaFinder(inputText, textareaRef);

  const handleToggleMode = () => {
    setIsEditing((prev) => {
      const nextMode = !prev;
      if (nextMode && finder.isFinderOpen) {
        finder.closeFinder();
      }
      return nextMode;
    });
  };

  // Auto-scroll to active search match inside the read-only div
  useEffect(() => {
    if (!isEditing && finder.isFinderOpen && finder.totalMatches > 0) {
      const activeMark = readOnlyContainerRef.current?.querySelector(
        `mark[data-match-index="${finder.currentMatchIndex}"]`
      );
      if (activeMark) {
        activeMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isEditing, finder.isFinderOpen, finder.currentMatchIndex, finder.totalMatches]);

  const topContent = (
    <div className="flex flex-col bg-muted/20 border-border border-b w-full font-mono text-xs shrink-0">
      <div className="flex justify-between items-center gap-2 px-2 py-1 w-full">
        <div className="flex items-center gap-2">

          {/* Search Toggle Button - Disabled in Edit Mode */}
          <Button
            id="btn-toggle-input-finder"
            disabled={isEditing}
            className={`h-6 w-6 rounded transition-colors ${
              finder.isFinderOpen && !isEditing
                ? 'bg-primary/20 text-primary border border-primary/40 font-bold'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            variant="ghost"
            size="icon"
            onClick={finder.toggleFinder}
            data-tooltip={isEditing ? 'Search disabled in Edit mode' : 'Find in text (Cmd+F)'}
            title={isEditing ? 'Search disabled in Edit mode' : 'Find in text (Cmd+F)'}
          >
            <Search size={12} />
          </Button>

          {/* Read / Edit Mode Toggle Button */}
          <Button
            id="btn-toggle-input-mode"
            className="gap-1 hover:bg-muted px-2 rounded h-6 font-bold text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={handleToggleMode}
            data-tooltip={isEditing ? 'Switch to Read Mode' : 'Switch to Edit Mode'}
            title={isEditing ? 'Switch to Read Mode' : 'Switch to Edit Mode'}
          >
            {isEditing ? (
              <>
                <Eye size={12} />
                <span>Read</span>
              </>
            ) : (
              <>
                <Pencil size={12} />
                <span>Edit</span>
              </>
            )}
          </Button>

        </div>

        <div className="flex items-center gap-1 shrink-0">
            <span
            className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase border ${
              isEditing
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}
          >
            {isEditing ? 'Edit Mode' : 'Read Mode'}
          </span>

        </div>
      </div>

      {!isEditing && finder.isFinderOpen && (
        <div className="border-border/50 border-t w-full">
          <FinderBase
            searchQuery={finder.searchQuery}
            setSearchQuery={finder.setSearchQuery}
            caseSensitive={finder.caseSensitive}
            setCaseSensitive={finder.setCaseSensitive}
            wholeWord={finder.wholeWord}
            setWholeWord={finder.setWholeWord}
            useRegex={finder.useRegex}
            setUseRegex={finder.setUseRegex}
            currentMatchIndex={finder.currentMatchIndex}
            totalMatches={finder.totalMatches}
            onNext={finder.handleNextMatch}
            onPrev={finder.handlePrevMatch}
            onClose={finder.closeFinder}
            focusTrigger={finder.focusTrigger}
            placeholder="Find in text..."
          />
        </div>
      )}
    </div>
  );

  const middleContent = (
    <div className="flex flex-col bg-background p-1.5 w-full h-full min-h-0 font-mono text-xs">
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste input HTML, XML, Markdown, or raw text content..."
          className="flex-1 bg-muted/20 border-border h-full font-mono text-xs resize-none"
          spellCheck={false}
        />
      ) : (
        <div
          ref={readOnlyContainerRef}
          className="flex-1 bg-muted/20 p-3 border border-border rounded-md w-full h-full overflow-auto font-mono text-foreground text-xs break-words leading-normal whitespace-pre-wrap select-text"
        >
          <FinderHtml
            text={inputText}
            searchQuery={finder.isFinderOpen ? finder.searchQuery : ''}
            caseSensitive={finder.caseSensitive}
            wholeWord={finder.wholeWord}
            useRegex={finder.useRegex}
            currentMatchIndex={finder.currentMatchIndex}
          />
        </div>
      )}
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-input-payload"
      className="bg-card w-full h-full min-h-0 overflow-hidden"
      top={topContent}
      middle={middleContent}
    />
  );
};

export default InputPanel;

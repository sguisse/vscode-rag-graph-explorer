#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src/components/app/core/finder/hooks
mkdir -p webview/src/features/transformer/components

# Update useTextareaFinder to safely support optional textareaRef in Read mode
cat << 'EOF' > webview/src/components/app/core/finder/hooks/useTextareaFinder.ts
import { useMemo, useCallback, useEffect } from 'react';
import { useFinderBase, UseFinderBaseOptions } from './useFinderBase';
import { buildSearchRegex } from '../constants';

export interface TextareaMatch {
  index: number;
  start: number;
  end: number;
  text: string;
}

export function useTextareaFinder(
  text: string,
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>,
  options: UseFinderBaseOptions = {}
) {
  const finderBase = useFinderBase(options);
  const { searchQuery, caseSensitive, wholeWord, useRegex, currentMatchIndex, setCurrentMatchIndex } = finderBase;

  const matches = useMemo<TextareaMatch[]>(() => {
    if (!text || !searchQuery) return [];

    const regex = buildSearchRegex(searchQuery, { caseSensitive, wholeWord, useRegex });
    if (!regex) return [];

    const result: TextareaMatch[] = [];
    let match: RegExpExecArray | null;
    let counter = 0;

    while ((match = regex.exec(text)) !== null) {
      result.push({
        index: counter++,
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
      });
      if (match[0].length === 0) regex.lastIndex++;
    }
    return result;
  }, [text, searchQuery, caseSensitive, wholeWord, useRegex]);

  const totalMatches = matches.length;

  const scrollToMatch = useCallback(
    (matchIndex: number) => {
      const activeMatch = matches[matchIndex];
      const el = textareaRef?.current;
      if (!activeMatch || !el) return;

      el.setSelectionRange(activeMatch.start, activeMatch.end);

      const lineHeight = parseInt(window.getComputedStyle(el).lineHeight || '20', 10);
      const linesBefore = text.substring(0, activeMatch.start).split('\n').length - 1;
      el.scrollTop = linesBefore * lineHeight - el.clientHeight / 2;
    },
    [matches, textareaRef, text]
  );

  useEffect(() => {
    if (finderBase.isFinderOpen && totalMatches > 0 && textareaRef?.current) {
      scrollToMatch(currentMatchIndex);
    }
  }, [currentMatchIndex, totalMatches, finderBase.isFinderOpen, scrollToMatch, textareaRef]);

  const handleNextMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % totalMatches);
  }, [totalMatches, setCurrentMatchIndex]);

  const handlePrevMatch = useCallback(() => {
    if (totalMatches === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + totalMatches) % totalMatches);
  }, [totalMatches, setCurrentMatchIndex]);

  return {
    ...finderBase,
    matches,
    totalMatches,
    handleNextMatch,
    handlePrevMatch,
    scrollToMatch,
  };
}
EOF

# Update InputPanel.tsx to replace Textarea with read-only div + FinderHtml highlighting, Read/Edit mode toggle, and disabled search in edit mode
cat << 'EOF' > webview/src/features/transformer/components/InputPanel.tsx
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
    <div className="flex flex-col border-b border-border bg-muted/20 w-full font-mono text-xs shrink-0">
      <div className="flex justify-between items-center px-2 py-1 w-full gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[10px] text-muted-foreground uppercase">
            Input Payload
          </span>
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

        <div className="flex items-center gap-1 shrink-0">
          {/* Read / Edit Mode Toggle Button */}
          <Button
            id="btn-toggle-input-mode"
            className="h-6 px-2 gap-1 rounded text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
        </div>
      </div>

      {!isEditing && finder.isFinderOpen && (
        <div className="border-t border-border/50 w-full">
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
    <div className="flex flex-col h-full w-full font-mono text-xs bg-background p-1.5 min-h-0">
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Paste input HTML, XML, Markdown, or raw text content..."
          className="flex-1 h-full bg-muted/20 font-mono text-xs resize-none border-border"
          spellCheck={false}
        />
      ) : (
        <div
          ref={readOnlyContainerRef}
          className="flex-1 w-full h-full p-3 font-mono text-xs leading-normal bg-muted/20 border border-border rounded-md overflow-auto whitespace-pre-wrap break-words select-text text-foreground"
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
EOF

echo "✅ feat: Added Read/Edit mode toggle to InputPanel, rendering a formatted div with FinderHtml highlights in Read mode and disabling search in Edit mode!"

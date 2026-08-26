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
  textareaRef: React.RefObject<HTMLTextAreaElement | null>,
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
      const el = textareaRef.current;
      if (!activeMatch || !el) return;

      el.focus();
      el.setSelectionRange(activeMatch.start, activeMatch.end);

      const lineHeight = parseInt(window.getComputedStyle(el).lineHeight || '20', 10);
      const linesBefore = text.substring(0, activeMatch.start).split('\n').length - 1;
      el.scrollTop = linesBefore * lineHeight - el.clientHeight / 2;
    },
    [matches, textareaRef, text]
  );

  useEffect(() => {
    if (finderBase.isFinderOpen && totalMatches > 0) {
      scrollToMatch(currentMatchIndex);
    }
  }, [currentMatchIndex, totalMatches, finderBase.isFinderOpen, scrollToMatch]);

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
  };
}

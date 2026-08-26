import React, { useMemo } from 'react';
import { buildSearchRegex } from './constants';

export interface TextChunk {
  text: string;
  isMatch: boolean;
  globalIndex?: number;
}

export interface FinderHtmlProps {
  text: string;
  searchQuery: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  currentMatchIndex: number;
  matchStartIndex?: number;
  onLinkClick?: (url: string) => void;
  className?: string;
}

export const FinderHtml: React.FC<FinderHtmlProps> = ({
  text,
  searchQuery,
  caseSensitive,
  wholeWord,
  useRegex,
  currentMatchIndex,
  matchStartIndex = 0,
  onLinkClick,
  className = '',
}) => {
  const renderedNodes = useMemo(() => {
    const rawText = text || '';
    const regex = buildSearchRegex(searchQuery, { caseSensitive, wholeWord, useRegex });
    if (!regex) {
      return [rawText];
    }

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let localMatchCounter = 0;

    while ((match = regex.exec(rawText)) !== null) {
      if (match.index > lastIndex) {
        nodes.push(rawText.substring(lastIndex, match.index));
      }

      const globalIdx = matchStartIndex + localMatchCounter;
      const isActive = globalIdx === currentMatchIndex;
      const markClass = isActive
        ? 'bg-orange-500 text-black font-extrabold shadow-sm outline outline-1 outline-white z-10 px-0.5 rounded-sm animate-pulse'
        : 'bg-yellow-400 text-black px-0.5 rounded-sm';

      nodes.push(
        <mark key={`${match.index}-${localMatchCounter}`} data-match-index={globalIdx} className={markClass}>
          {match[0]}
        </mark>
      );

      localMatchCounter++;
      lastIndex = regex.lastIndex;
      if (match[0].length === 0) {
        regex.lastIndex++;
      }
    }

    if (lastIndex < rawText.length) {
      nodes.push(rawText.substring(lastIndex));
    }

    return nodes;
  }, [text, searchQuery, caseSensitive, wholeWord, useRegex, matchStartIndex, currentMatchIndex]);

  const handleLinkClickIntercept = (e: React.MouseEvent<HTMLSpanElement>) => {
    const targetElement = e.target as HTMLElement;
    const closestAnchor = targetElement.closest('a');

    if (closestAnchor) {
      const targetUrl = closestAnchor.getAttribute('href');
      if (targetUrl) {
        e.preventDefault();
        e.stopPropagation();

        if (onLinkClick) {
          onLinkClick(targetUrl);
        } else {
          window.open(targetUrl, '_blank', 'noopener,noreferrer');
        }
      }
    }
  };

  return (
    <span className={className} onClick={handleLinkClickIntercept}>
      {renderedNodes}
    </span>
  );
};

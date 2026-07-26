import React, { useMemo } from 'react';

export interface TextChunk {
    text: string;
    isMatch: boolean;
    globalIndex?: number;
}

interface FinderHtmlProps {
    text: string;
    searchQuery: string;
    caseSensitive: boolean;
    wholeWord: boolean;
    useRegex: boolean;
    currentMatchIndex: number;
    matchStartIndex: number;
}

export const FinderHtml: React.FC<FinderHtmlProps> = ({
    text,
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    currentMatchIndex,
    matchStartIndex
}) => {
    const chunks = useMemo(() => {
        const rawText = text || '';
        if (!searchQuery) {
            return [{ text: rawText, isMatch: false }];
        }

        let pattern = useRegex ? searchQuery : searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (wholeWord) {
            pattern = `\\b${pattern}\\b`;
        }

        try {
            const regex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
            const result: TextChunk[] = [];
            let lastIndex = 0;
            let match;
            let localMatchCounter = 0;

            while ((match = regex.exec(rawText)) !== null) {
                if (match.index > lastIndex) {
                    result.push({ text: rawText.substring(lastIndex, match.index), isMatch: false });
                }

                result.push({
                    text: match[0],
                    isMatch: true,
                    globalIndex: matchStartIndex + localMatchCounter
                });

                localMatchCounter++;
                lastIndex = regex.lastIndex;
                if (match[0].length === 0) {
                    regex.lastIndex++;
                }
            }

            if (lastIndex < rawText.length) {
                result.push({ text: rawText.substring(lastIndex), isMatch: false });
            }

            return result;
        } catch (e) {
            return [{ text: rawText, isMatch: false }];
        }
    }, [text, searchQuery, caseSensitive, wholeWord, useRegex, matchStartIndex]);

    const handleLinkClickIntercept = (e: React.MouseEvent<HTMLSpanElement>) => {
        const targetElement = e.target as HTMLElement;
        const closestAnchor = targetElement.closest('a');

        if (closestAnchor) {
            e.preventDefault();
            e.stopPropagation();

            const targetUrl = closestAnchor.getAttribute('href');
            if (!targetUrl) return;

            const vscode = (window as any).vscodeApi || (typeof (window as any).acquireVsCodeApi === 'function' ? (window as any).acquireVsCodeApi() : null);

            if (vscode) {
                vscode.postMessage({
                    command: 'openExternal',
                    url: targetUrl
                });
            } else {
                window.open(targetUrl, '_blank', 'noopener,noreferrer');
            }
        }
    };

    return (
        <span
            onClick={handleLinkClickIntercept}
            dangerouslySetInnerHTML={{
                __html: chunks.map(chunk => {
                    if (chunk.isMatch) {
                        const isActive = chunk.globalIndex === currentMatchIndex;
                        const markClass = isActive
                            ? 'bg-orange-500 text-black font-extrabold shadow-sm outline outline-1 outline-white z-10 px-0.5 rounded-sm animate-pulse'
                            : 'bg-yellow-400 text-black px-0.5 rounded-sm';
                        return `<mark data-match-index="${chunk.globalIndex}" class="${markClass}">${chunk.text}</mark>`;
                    }
                    return chunk.text;
                }).join('')
            }}
        />
    );
};

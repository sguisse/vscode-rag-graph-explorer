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
    globalMatchCounterRef?: React.MutableRefObject<number>;
}

export const FinderHtml: React.FC<FinderHtmlProps> = ({
    text,
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
    currentMatchIndex,
    globalMatchCounterRef
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

            while ((match = regex.exec(rawText)) !== null) {
                if (match.index > lastIndex) {
                    result.push({ text: rawText.substring(lastIndex, match.index), isMatch: false });
                }

                const currentIdx = globalMatchCounterRef ? globalMatchCounterRef.current++ : 0;

                result.push({
                    text: match[0],
                    isMatch: true,
                    globalIndex: currentIdx
                });

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
    }, [text, searchQuery, caseSensitive, wholeWord, useRegex, globalMatchCounterRef]);

    // SOLID CLICK ROUTER: Safely delegates link routing out of the webview sandbox sandbox environment
    const handleLinkClickIntercept = (e: React.MouseEvent<HTMLSpanElement>) => {
        const targetElement = e.target as HTMLElement;
        const closestAnchor = targetElement.closest('a');

        if (closestAnchor) {
            // Prevent the internal sandbox from trying to process file:// or bolt:// routes
            e.preventDefault();
            e.stopPropagation();

            const targetUrl = closestAnchor.getAttribute('href');
            if (!targetUrl) return;

            // Resolve access to the global VS Code API instance acquired in your extension page boilerplate
            const vscode = (window as any).vscodeApi || (typeof (window as any).acquireVsCodeApi === 'function' ? (window as any).acquireVsCodeApi() : null);

            if (vscode) {
                // Post command up to your Extension Host message router listener
                vscode.postMessage({
                    command: 'openExternal',
                    url: targetUrl
                });
            } else {
                // Standalone web browser testing fallback mode profiles
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
                            ? 'bg-orange-500 text-black font-extrabold shadow-sm outline outline-1 outline-white z-10 px-0.5 rounded-sm'
                            : 'bg-yellow-400 text-black px-0.5 rounded-sm';
                        return `<mark data-match-index="${chunk.globalIndex}" class="${markClass}">${chunk.text}</mark>`;
                    }
                    return chunk.text;
                }).join('')
            }}
        />
    );
};

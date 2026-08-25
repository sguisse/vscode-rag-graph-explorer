import React, { useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export type FinderStyleView = 'bubble' | 'toolbar';

export interface FinderBaseProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    caseSensitive: boolean;
    setCaseSensitive: (val: boolean) => void;
    wholeWord: boolean;
    setWholeWord: (val: boolean) => void;
    useRegex: boolean;
    setUseRegex: (val: boolean) => void;
    styleView?: FinderStyleView;
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
    styleView = 'bubble',
    focusTrigger = 0,
    currentMatchIndex,
    totalMatches,
    onNext,
    onPrev,
    onClose,
    placeholder = "Find (Cmd+F)",
    extraActions
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [focusTrigger]);

    const containerStyleClass = styleView === 'toolbar'
        ? 'p-1 px-2 border-b border-border shadow-none rounded-none w-full'
        : 'p-1.5 border border-border shadow-md rounded-md';

    return (
        <div className={`flex items-center gap-2 bg-popover text-popover-foreground animate-fadeIn select-none font-sans text-xs ${containerStyleClass}`}>
            <div className="relative flex items-center bg-muted/40 px-2 border border-input focus-within:border-ring rounded flex-1 min-w-0 h-6 transition-colors">
                <Search size={13} className="text-muted-foreground shrink-0 mr-1.5 pointer-events-none" />
                <Input
                    ref={inputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={placeholder}
                    className="bg-transparent shadow-none p-0 border-0 focus-visible:ring-0 focus-visible:outline-none flex-1 min-w-0 h-full font-sans text-foreground text-xs placeholder:text-muted-foreground"
                    spellCheck={false}
                />

                <div className="flex items-center gap-0.5 text-muted-foreground shrink-0 ml-1">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        data-tooltip="Match Case (Aa)"
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
                        data-tooltip="Match Whole Word (W)"
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
                        data-tooltip="Use Regular Expression (.*)"
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
                            data-tooltip="Clear Input"
                            onClick={() => setSearchQuery('')}
                            className="w-4 h-4 p-0 rounded-sm flex items-center justify-center transition-colors cursor-pointer text-muted-foreground hover:bg-muted hover:text-foreground ml-0.5"
                        >
                            <X size={12} />
                        </Button>
                    )}
                </div>
            </div>

            {extraActions}

            <div className="px-1 min-w-[55px] font-sans font-medium text-[11px] text-muted-foreground text-center shrink-0">
                {totalMatches > 0 ? `${currentMatchIndex + 1} of ${totalMatches}` : 'No results'}
            </div>

            <div className="flex items-center gap-0.5 pl-1 border-border border-l text-foreground shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onPrev}
                    disabled={totalMatches === 0}
                    data-tooltip="Previous Match"
                    className="flex justify-center items-center hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 rounded w-5 h-5 text-xs cursor-pointer transition-colors"
                >
                    <ChevronUp size={12} />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onNext}
                    disabled={totalMatches === 0}
                    data-tooltip="Next Match"
                    className="flex justify-center items-center hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 rounded w-5 h-5 text-xs cursor-pointer transition-colors"
                >
                    <ChevronDown size={12} />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    data-tooltip="Close Widget (Escape)"
                    className="flex justify-center items-center hover:bg-muted text-muted-foreground hover:text-foreground rounded w-5 h-5 text-xs cursor-pointer transition-colors"
                >
                    <X size={12} />
                </Button>
            </div>
        </div>
    );
};

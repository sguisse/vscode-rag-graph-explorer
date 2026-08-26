import { useState, useCallback, useEffect } from 'react';
import { useFinderCommon } from './useFinderCommon';

export interface UseFinderBaseOptions {
  initialSearchQuery?: string;
  initialCaseSensitive?: boolean;
  initialWholeWord?: boolean;
  initialUseRegex?: boolean;
}

export function useFinderBase(options: UseFinderBaseOptions = {}) {
  const [isFinderOpen, setIsFinderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(options.initialSearchQuery || '');
  const [caseSensitive, setCaseSensitive] = useState(options.initialCaseSensitive || false);
  const [wholeWord, setWholeWord] = useState(options.initialWholeWord || false);
  const [useRegex, setUseRegex] = useState(options.initialUseRegex || false);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [focusTrigger, setFocusTrigger] = useState(0);

  const { activeRegex } = useFinderCommon({
    searchQuery,
    caseSensitive,
    wholeWord,
    useRegex,
  });

  const openAndFocusFinder = useCallback(() => {
    setIsFinderOpen(true);
    setFocusTrigger((prev) => prev + 1);
  }, []);

  const toggleFinder = useCallback(() => {
    setIsFinderOpen((prev) => {
      if (!prev) {
        setFocusTrigger((p) => p + 1);
      }
      return !prev;
    });
  }, []);

  const closeFinder = useCallback(() => {
    setIsFinderOpen(false);
  }, []);

  useEffect(() => {
    setCurrentMatchIndex(0);
  }, [searchQuery, caseSensitive, wholeWord, useRegex]);

  return {
    isFinderOpen,
    setIsFinderOpen,
    toggleFinder,
    openAndFocusFinder,
    closeFinder,
    focusTrigger,
    searchQuery,
    setSearchQuery,
    caseSensitive,
    setCaseSensitive,
    wholeWord,
    setWholeWord,
    useRegex,
    setUseRegex,
    currentMatchIndex,
    setCurrentMatchIndex,
    activeRegex,
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { initialCodebase } from '@/features/explorer/wksp-cnt-graph/components/graph/GraphData';

export interface UseImpactedPathsOptions {
  defaultCodebase?: CodebaseData;
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function useImpactedPaths(options: UseImpactedPathsOptions = {}) {
  const {
    defaultCodebase = initialCodebase,
    onCodebaseChange,
    upstreamDepth = 2,
    downstreamDepth = 2,
  } = options;

  const [currentPath, setCurrentPath] = useState('');
  const [pathsList, setPathsList] = useState<string[]>(['']);
  const [codebaseData, setCodebaseData] = useState<CodebaseData>(defaultCodebase);
  const [paths, setPaths] = useState<string>('');

  const [internalUpstreamDepth, setInternalUpstreamDepth] = useState<number>(upstreamDepth);
  const [internalDownstreamDepth, setInternalDownstreamDepth] = useState<number>(downstreamDepth);

  useEffect(() => {
    setInternalUpstreamDepth(upstreamDepth);
  }, [upstreamDepth]);

  useEffect(() => {
    setInternalDownstreamDepth(downstreamDepth);
  }, [downstreamDepth]);

  const effectiveUpstreamDepth = upstreamDepth !== undefined ? upstreamDepth : internalUpstreamDepth;
  const effectiveDownstreamDepth = downstreamDepth !== undefined ? downstreamDepth : internalDownstreamDepth;

  const depthRef = useRef({
    upstreamDepth: effectiveUpstreamDepth,
    downstreamDepth: effectiveDownstreamDepth,
  });

  useEffect(() => {
    depthRef.current = {
      upstreamDepth: effectiveUpstreamDepth,
      downstreamDepth: effectiveDownstreamDepth,
    };
  }, [effectiveUpstreamDepth, effectiveDownstreamDepth]);

  const updatePath = useCallback((newPath: string) => {
    setCurrentPath(newPath);
    setPathsList((prev) => (prev.includes(newPath) ? prev : [...prev, newPath]));
  }, []);

  const fetchImpacts = useCallback(
    async (
      targetPaths: string,
      up = depthRef.current.upstreamDepth,
      down = depthRef.current.downstreamDepth
    ) => {
      if (!targetPaths.trim()) return;
      logInfo(`[useImpactedPaths] Fetching impacts for paths with upstreamDepth=${up}, downstreamDepth=${down}`);
      const realCodebaseData = await getPathsChangeImpacts(targetPaths, up, down);

      if (realCodebaseData) {
        setCodebaseData(realCodebaseData);
        if (onCodebaseChange) {
          onCodebaseChange(realCodebaseData);
        }
      }
    },
    [onCodebaseChange]
  );

  const handlePathsChange = useCallback(
    (newPaths: string) => {
      setPaths(newPaths);
      updatePath(newPaths);
      fetchImpacts(newPaths, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
    },
    [updatePath, fetchImpacts]
  );

  const appendOrReplacePath = useCallback(
    (newPath: string) => {
      setPaths((prev) => {
        let updated = newPath.trim();
        if (prev.trim()) {
          const existingLines = prev.split('\n').map((l) => l.trim()).filter(Boolean);
          if (!existingLines.includes(newPath.trim())) {
            updated = `${prev.trim()}\n${newPath.trim()}`;
          } else {
            updated = prev;
          }
        }
        updatePath(updated);
        fetchImpacts(updated, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
        return updated;
      });
    },
    [updatePath, fetchImpacts]
  );

  const setUpstreamDepth = useCallback(
    (val: number) => {
      setInternalUpstreamDepth(val);
      if (paths.trim()) {
        fetchImpacts(paths, val, depthRef.current.downstreamDepth);
      }
    },
    [paths, fetchImpacts]
  );

  const setDownstreamDepth = useCallback(
    (val: number) => {
      setInternalDownstreamDepth(val);
      if (paths.trim()) {
        fetchImpacts(paths, depthRef.current.upstreamDepth, val);
      }
    },
    [paths, fetchImpacts]
  );

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (paths.trim()) {
      fetchImpacts(paths, effectiveUpstreamDepth, effectiveDownstreamDepth);
    }
  }, [effectiveUpstreamDepth, effectiveDownstreamDepth, fetchImpacts, paths]);

  useEffect(() => {
    const unsubscribeStatus = vsCodeHandleMessage.on('selectedPath', (message) => {
      logInfo(`[useImpactedPaths] selectedPath event received: ${message.payload}`);
      if (message.payload) {
        handlePathsChange(message.payload);
      }
    });

    const unsubscribeAddPath = vsCodeHandleMessage.on('addPathToTop', (message) => {
      logInfo(`[useImpactedPaths] addPathToTop event received: ${message.payload}`);
      if (message.payload) {
        appendOrReplacePath(message.payload);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeAddPath();
    };
  }, [handlePathsChange, appendOrReplacePath]);

  const handleTextareaChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      handlePathsChange(e.target.value);
    },
    [handlePathsChange]
  );

  return {
    paths,
    currentPath,
    pathsList,
    codebaseData,
    upstreamDepth: effectiveUpstreamDepth,
    downstreamDepth: effectiveDownstreamDepth,
    setUpstreamDepth,
    setDownstreamDepth,
    updatePath,
    setCodebaseData,
    handleTextareaChange,
    handlePathsChange,
    appendOrReplacePath,
    fetchImpacts,
  };
}

import { useEffect, useCallback, useRef } from 'react';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useExplorerStore } from '../../store/useExplorerStore';

export interface UseImpactedPathsOptions {
  defaultCodebase?: CodebaseData;
  onCodebaseChange?: (codebase: CodebaseData) => void;
  upstreamDepth?: number;
  downstreamDepth?: number;
}

export function useImpactedPaths(options: UseImpactedPathsOptions = {}) {
  const {
    onCodebaseChange,
    upstreamDepth = 2,
    downstreamDepth = 2,
  } = options;

  const currentPath = useExplorerStore((s) => s.currentPath);
  const setCurrentPath = useExplorerStore((s) => s.setCurrentPath);
  const pathsList = useExplorerStore((s) => s.pathsList);
  const setPathsList = useExplorerStore((s) => s.setPathsList);
  const codebaseData = useExplorerStore((s) => s.codebase);
  const setCodebaseData = useExplorerStore((s) => s.setCodebase);
  const paths = useExplorerStore((s) => s.paths);
  const setPaths = useExplorerStore((s) => s.setPaths);

  const internalUpstreamDepth = useExplorerStore((s) => s.upstreamDepth);
  const setInternalUpstreamDepth = useExplorerStore((s) => s.setUpstreamDepth);
  const internalDownstreamDepth = useExplorerStore((s) => s.downstreamDepth);
  const setInternalDownstreamDepth = useExplorerStore((s) => s.setDownstreamDepth);

  useEffect(() => {
    if (upstreamDepth !== undefined && upstreamDepth !== internalUpstreamDepth) {
      setInternalUpstreamDepth(upstreamDepth);
    }
  }, [upstreamDepth, internalUpstreamDepth, setInternalUpstreamDepth]);

  useEffect(() => {
    if (downstreamDepth !== undefined && downstreamDepth !== internalDownstreamDepth) {
      setInternalDownstreamDepth(downstreamDepth);
    }
  }, [downstreamDepth, internalDownstreamDepth, setInternalDownstreamDepth]);

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

  const updatePath = useCallback(
    (newPath: string) => {
      setCurrentPath(newPath);
      setPathsList((prev) => (prev.includes(newPath) ? prev : [...prev, newPath]));
    },
    [setCurrentPath, setPathsList]
  );

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
    [onCodebaseChange, setCodebaseData]
  );

  const handlePathsChange = useCallback(
    (newPaths: string) => {
      setPaths(newPaths);
      updatePath(newPaths);
      fetchImpacts(newPaths, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
    },
    [setPaths, updatePath, fetchImpacts]
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
    [setPaths, updatePath, fetchImpacts]
  );

  const setUpstreamDepth = useCallback(
    (val: number) => {
      setInternalUpstreamDepth(val);
      if (paths.trim()) {
        fetchImpacts(paths, val, depthRef.current.downstreamDepth);
      }
    },
    [paths, fetchImpacts, setInternalUpstreamDepth]
  );

  const setDownstreamDepth = useCallback(
    (val: number) => {
      setInternalDownstreamDepth(val);
      if (paths.trim()) {
        fetchImpacts(paths, depthRef.current.upstreamDepth, val);
      }
    },
    [paths, fetchImpacts, setInternalDownstreamDepth]
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

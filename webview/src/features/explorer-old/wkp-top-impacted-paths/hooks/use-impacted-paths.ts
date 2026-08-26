// webview/src/features/explorer-old/wkp-top-impacted-paths/hooks/use-impacted-paths.ts
import { useEffect, useCallback, useRef } from 'react';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
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
    upstreamDepth: propUpstreamDepth,
    downstreamDepth: propDownstreamDepth,
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

  // Sync prop changes ONLY if prop is explicitly defined and differs from internal store
  useEffect(() => {
    if (propUpstreamDepth !== undefined && propUpstreamDepth !== internalUpstreamDepth) {
      setInternalUpstreamDepth(propUpstreamDepth);
    }
  }, [propUpstreamDepth, internalUpstreamDepth, setInternalUpstreamDepth]);

  useEffect(() => {
    if (propDownstreamDepth !== undefined && propDownstreamDepth !== internalDownstreamDepth) {
      setInternalDownstreamDepth(propDownstreamDepth);
    }
  }, [propDownstreamDepth, internalDownstreamDepth, setInternalDownstreamDepth]);

  const effectiveUpstreamDepth = propUpstreamDepth !== undefined ? propUpstreamDepth : internalUpstreamDepth;
  const effectiveDownstreamDepth = propDownstreamDepth !== undefined ? propDownstreamDepth : internalDownstreamDepth;

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

  const buildDefaultCypherQueryParameters = useCallback(async () => {
    const currentStoreState = useExplorerStore.getState();
    const activePaths = currentStoreState.paths || '';
    const activeUpstream = currentStoreState.upstreamDepth;
    const activeDownstream = currentStoreState.downstreamDepth;

    const formattedTargetPath = activePaths.trim()
      ? activePaths.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')
      : '???';

    const cypherParams = `:param {
  targetPath: "${formattedTargetPath}",
  upstreamDepth: "${activeUpstream}",
  downstreamDepth: "${activeDownstream}"
}`;

    logInfo(`[useImpactedPaths] Cypher parameters generated:\n${cypherParams}`);
    await vsCodeApiService.copyToClipboard(cypherParams);
  }, []);

  const appendOrReplacePath = useCallback(
    (newPath: string) => {
      setPaths((prev) => {
        let updated = newPath.trim();
        if (prev.trim()) {
          const existingLines = prev.split('\n').map((l) => l.trim()).filter(Boolean);
          if (!existingLines.includes(newPath.trim())) {
            updated = `${newPath.trim()}\n${prev.trim()}`;
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
    buildDefaultCypherQueryParameters,
  };
}

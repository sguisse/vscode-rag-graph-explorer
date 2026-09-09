import { useEffect, useCallback, useRef } from 'react';
import { vsCodeBackendMessageHandler } from '@/services/listener/vscode-backend-message.handler';
import { getPathsChangeImpacts } from '@/services/view/graph-view.service';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useCodebaseDomainState, CodebaseDomainState } from '../../../store/useCodebaseDomainState';
import { EXPLORER_ADD_PATHS } from '@/shared/config/vscode-message-command.constants';

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

  const currentPath = useCodebaseDomainState((s: CodebaseDomainState) => s.currentPath);
  const setCurrentPath = useCodebaseDomainState((s: CodebaseDomainState) => s.setCurrentPath);
  const pathsList = useCodebaseDomainState((s: CodebaseDomainState) => s.pathsList);
  const setPathsList = useCodebaseDomainState((s: CodebaseDomainState) => s.setPathsList);
  const codebaseData = useCodebaseDomainState((s: CodebaseDomainState) => s.codebase);
  const setCodebaseData = useCodebaseDomainState((s: CodebaseDomainState) => s.setCodebase);
  const selectAllFiles = useCodebaseDomainState((s: CodebaseDomainState) => s.selectAllFiles);
  const paths = useCodebaseDomainState((s: CodebaseDomainState) => s.paths);
  const setPaths = useCodebaseDomainState((s: CodebaseDomainState) => s.setPaths);

  const internalUpstreamDepth = useCodebaseDomainState((s: CodebaseDomainState) => s.upstreamDepth);
  const setInternalUpstreamDepth = useCodebaseDomainState((s: CodebaseDomainState) => s.setUpstreamDepth);
  const internalDownstreamDepth = useCodebaseDomainState((s: CodebaseDomainState) => s.downstreamDepth);
  const setInternalDownstreamDepth = useCodebaseDomainState((s: CodebaseDomainState) => s.setDownstreamDepth);

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
      setPathsList((prev: string[]) => (prev.includes(newPath) ? prev : [...prev, newPath]));
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
        selectAllFiles();
        if (onCodebaseChange) {
          onCodebaseChange(realCodebaseData);
        }
      }
    },
    [onCodebaseChange, setCodebaseData, selectAllFiles]
  );

  const handlePathsChange = useCallback(
    (newPaths: string) => {
      setPaths(newPaths);
      updatePath(newPaths);
      fetchImpacts(newPaths, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
    },
    [setPaths, updatePath, fetchImpacts]
  );

  const appendPaths = useCallback(
    (rawPayload: any) => {
      const payloadStr = typeof rawPayload === 'string'
        ? rawPayload
        : rawPayload?.payload || rawPayload?.paths || '';

      if (!payloadStr || typeof payloadStr !== 'string') return;

      const incomingPaths = payloadStr
        .split(/[,\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);

      if (incomingPaths.length === 0) return;

      const currentPathsStr = useCodebaseDomainState.getState().paths || '';
      const existingPaths = currentPathsStr
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);

      const combined = Array.from(new Set([...incomingPaths, ...existingPaths]));
      const updatedPathsStr = combined.join('\n');

      logInfo(`[useImpactedPaths] Appending ${incomingPaths.length} path(s). Total: ${combined.length}`);

      setPaths(updatedPathsStr);
      updatePath(updatedPathsStr);
      fetchImpacts(updatedPathsStr, depthRef.current.upstreamDepth, depthRef.current.downstreamDepth);
    },
    [setPaths, updatePath, fetchImpacts]
  );

  const buildDefaultCypherQueryParameters = useCallback(async () => {
    const currentStoreState = useCodebaseDomainState.getState();
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
    const unsubscribeStatus = vsCodeBackendMessageHandler.on(EXPLORER_ADD_PATHS, (message) => {
      const rawPayload = message?.payload || message;
      logInfo(`[useImpactedPaths] EXPLORER_ADD_PATHS event received:`, [rawPayload]);
      if (rawPayload) {
        appendPaths(rawPayload);
      }
    });

    const unsubscribeAddPath = vsCodeBackendMessageHandler.on('addPathToTop', (message) => {
      const rawPayload = message?.payload || message;
      logInfo(`[useImpactedPaths] addPathToTop event received:`, [rawPayload]);
      if (rawPayload) {
        appendPaths(rawPayload);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeAddPath();
    };
  }, [appendPaths]);

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
    appendOrReplacePath: appendPaths,
    fetchImpacts,
    buildDefaultCypherQueryParameters,
  };
}

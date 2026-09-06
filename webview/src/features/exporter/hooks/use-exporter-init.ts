import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { normalizeExportConfig } from '../utils/exporter-config.normalizer';

export function useExporterInit() {
  const store = useExporterStore();

  useEffect(() => {
    const unsubscribeSelectedPath = vsCodeHandleMessage.on('selectedPath', (msg) => {
      if (msg.payload) {
        store.setConfig((prev) => {
          const currentPaths = prev.codebase?.src ? prev.codebase.src.split(/[, \n\r]+/) : [];
          const newPaths = String(msg.payload).split(/[, \n\r]+/);
          const combined = Array.from(new Set([...currentPaths, ...newPaths])).map((s) => s.trim()).filter(Boolean);
          return {
            ...prev,
            codebase: { ...prev.codebase, src: combined.join('\n') },
          };
        });
      }
    });

    const unsubscribeUpdatePaths = vsCodeHandleMessage.on('updatePaths', (msg) => {
      if (Array.isArray(msg.paths)) {
        const flatPaths = msg.paths.flatMap((p) => String(p).split(/[, \n\r]+/)).map((s) => s.trim()).filter(Boolean);
        store.setConfig((prev) => ({
          ...prev,
          codebase: { ...prev.codebase, src: flatPaths.join('\n') },
        }));
      }
    });

    const init = async () => {
      try {
        const res = await fileExporterApiService.getInitialState();
        const normDefault = normalizeExportConfig(res.defaultConfig);
        const normCurrent = normalizeExportConfig(res.currentConfig);
        const normHistory = (res.history || []).map((h) => ({
          ...h,
          config: normalizeExportConfig(h.config),
        }));

        store.setInitialData({
          defaultConfig: normDefault,
          config: normCurrent,
          historyList: normHistory,
          selectedProfileId: res.selectedId,
          historyViewMode: res.historyViewMode,
          currentRepo: res.currentRepo,
          workspaceRoot: res.workspaceRoot,
          fileExtsCategoryGroups: res.fileExtsCategoryGroups,
          exchangeLinks: res.exchange,
          pendingPaths: res.pendingPaths || [],
        });
      } catch (e) {
        console.error('[useExporterInit] Error initializing exporter feature state:', e);
      }
    };

    init();

    return () => {
      unsubscribeSelectedPath();
      unsubscribeUpdatePaths();
    };
  }, []);
}

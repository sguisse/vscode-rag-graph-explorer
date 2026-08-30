import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function useExportConfiguration() {
  const store = useExporterStore();

  useEffect(() => {
    store.loadProfiles();

    const unsubscribeSelectedPath = vsCodeHandleMessage.on('selectedPath', (msg) => {
      if (msg.payload) {
        store.setConfig((prev) => {
          const currentPaths = prev.src ? prev.src.split('\n') : [];
          const newPaths = String(msg.payload).split('\n');
          const combined = Array.from(new Set([...currentPaths, ...newPaths])).filter(Boolean);
          return { ...prev, src: combined.join('\n') };
        });
      }
    });

    const unsubscribeUpdatePaths = vsCodeHandleMessage.on('updatePaths', (msg) => {
      if (Array.isArray(msg.paths)) {
        store.setConfig((prev) => ({ ...prev, src: msg.paths.join('\n') }));
      }
    });

    return () => {
      unsubscribeSelectedPath();
      unsubscribeUpdatePaths();
    };
  }, []);

  useEffect(() => {
    const paths = store.config.src.split('\n').filter(Boolean).join(',');
    const cmd = `python3 files-exporter.py --src '${paths || '.'}' --dest '${store.config.dest}' --format '${store.config.format}' --max-file ${store.config.max_file} --max-chunk ${store.config.max_chunk}${
      store.config.groupByExt ? ' --group-ext' : ''
    }${store.config.logConsole ? ' --log-console' : ''}${store.config.generateTreeView ? ' --tree-view' : ''}`;
    store.setCompiledBashCmd(cmd);
  }, [store.config]);

  const handleOpenHistoryFile = () => {
    vsCodeApiService.logMessage('INFO', 'Open History File Requested');
  };

  const handleRevealDestination = () => {
    vsCodeApiService.revealInExplorer(store.config.dest);
  };

  const handleOpenCursorLinePath = () => {
    const firstLine = store.config.src.split('\n')[0];
    if (firstLine) vsCodeApiService.openFile(firstLine.trim());
  };

  return {
    ...store,
    handleOpenHistoryFile,
    handleRevealDestination,
    handleOpenCursorLinePath,
  };
}

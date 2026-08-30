import { useState, useEffect, useCallback } from 'react';
import { ExportConfig, HistoryEntry, ExportReportData } from '../types/exporter.types';
import { DEFAULT_EXPORT_CONFIG } from '../constants/exporter-constants';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';

const STORAGE_KEY = 'tokenRazor.exporter.historyProfiles';

export function useExporterState() {
  const [historyList, setHistoryList] = useState<HistoryEntry[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('default');
  const [config, setConfig] = useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('report');

  const [terminalLogs, setTerminalLogs] = useState<string>('');
  const [compiledBashCmd, setCompiledBashCmd] = useState<string>('');

  const [reportData, setReportData] = useState<ExportReportData | null>(null);
  const [filterSimulatorInput, setFilterSimulatorInput] = useState<string>('');

  useEffect(() => {
    vsCodeApiService.readUserPreferences(STORAGE_KEY).then((data) => {
      if (Array.isArray(data?.profiles)) {
        setHistoryList(data.profiles);
      }
    }).catch(() => {});

    const unsubscribeSelectedPath = vsCodeHandleMessage.on('selectedPath', (msg) => {
      if (msg.payload) {
        setConfig((prev) => {
          const currentPaths = prev.src ? prev.src.split('\n') : [];
          const newPaths = String(msg.payload).split('\n');
          const combined = Array.from(new Set([...currentPaths, ...newPaths])).filter(Boolean);
          return { ...prev, src: combined.join('\n') };
        });
      }
    });

    const unsubscribeUpdatePaths = vsCodeHandleMessage.on('updatePaths', (msg) => {
      if (Array.isArray(msg.paths)) {
        setConfig((prev) => ({ ...prev, src: msg.paths.join('\n') }));
      }
    });

    return () => {
      unsubscribeSelectedPath();
      unsubscribeUpdatePaths();
    };
  }, []);

  const saveProfilesToStorage = useCallback((profiles: HistoryEntry[]) => {
    setHistoryList(profiles);
    vsCodeApiService.saveUserPreferences(STORAGE_KEY, { profiles }).catch(() => {});
  }, []);

  const appendTerminalLog = (text: string) => {
    setTerminalLogs((prev) => prev + text);
  };

  const clearTerminalLogs = () => {
    setTerminalLogs('');
  };

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    if (id === 'default') {
      setConfig(DEFAULT_EXPORT_CONFIG);
    } else {
      const found = historyList.find((h) => h.id === id);
      if (found) setConfig(found.config);
    }
  };

  const handleFreezeToggle = (id: string) => {
    const updated = historyList.map((h) =>
      h.id === id ? { ...h, frozen: !h.frozen } : h
    );
    saveProfilesToStorage(updated);
  };

  const handleResetConfig = () => {
    if (selectedProfileId === 'default') {
      setConfig(DEFAULT_EXPORT_CONFIG);
    } else {
      const found = historyList.find((h) => h.id === selectedProfileId);
      if (found) setConfig(found.config);
    }
  };

  const handleRenameProfile = (id: string, newName: string) => {
    const updated = historyList.map((h) =>
      h.id === id ? { ...h, display: newName } : h
    );
    saveProfilesToStorage(updated);
  };

  const handleDuplicateProfile = (id: string) => {
    const targetConfig = id === 'default' ? config : historyList.find((h) => h.id === id)?.config || config;
    const newEntry: HistoryEntry = {
      id: `profile-${Date.now()}`,
      repo: 'workspace',
      display: `Profile Copy (${new Date().toLocaleTimeString()})`,
      frozen: false,
      config: { ...targetConfig },
    };
    const updated = [newEntry, ...historyList];
    saveProfilesToStorage(updated);
    setSelectedProfileId(newEntry.id);
  };

  const handleAddProfile = () => {
    const newEntry: HistoryEntry = {
      id: `profile-${Date.now()}`,
      repo: 'workspace',
      display: `New Profile (${new Date().toLocaleTimeString()})`,
      frozen: false,
      config: { ...DEFAULT_EXPORT_CONFIG },
    };
    const updated = [newEntry, ...historyList];
    saveProfilesToStorage(updated);
    setSelectedProfileId(newEntry.id);
    setConfig(DEFAULT_EXPORT_CONFIG);
  };

  const handleClearHistory = () => {
    saveProfilesToStorage([]);
    setSelectedProfileId('default');
    setConfig(DEFAULT_EXPORT_CONFIG);
  };

  useEffect(() => {
    const paths = config.src.split('\n').filter(Boolean).join(',');
    const cmd = `python3 files-exporter.py --src '${paths || '.'}' --dest '${config.dest}' --format '${config.format}' --max-file ${config.max_file} --max-chunk ${config.max_chunk}${
      config.groupByExt ? ' --group-ext' : ''
    }${config.logConsole ? ' --log-console' : ''}${config.generateTreeView ? ' --tree-view' : ''}`;
    setCompiledBashCmd(cmd);
  }, [config]);

  return {
    historyList,
    selectedProfileId,
    setSelectedProfileId: handleSelectProfile,
    config,
    setConfig,
    isRunning,
    setIsRunning,
    activeTab,
    setActiveTab,
    terminalLogs,
    appendTerminalLog,
    clearTerminalLogs,
    compiledBashCmd,
    setCompiledBashCmd,
    reportData,
    setReportData,
    filterSimulatorInput,
    setFilterSimulatorInput,
    handleFreezeToggle,
    handleResetConfig,
    handleRenameProfile,
    handleDuplicateProfile,
    handleAddProfile,
    handleClearHistory,
  };
}

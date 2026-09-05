#!/usr/bin/env bash
set -e

# Create necessary directories
mkdir -p webview/src/features/exporter/utils
mkdir -p webview/src/features/exporter/hooks
mkdir -p webview/src/features/exporter/components
mkdir -p webview/src/features/exporter/components/tabs

# 1. Update path-resolver.ts to ensure PathMappingService registers and maps both short and absolute paths cleanly
cat << 'EOF' > webview/src/features/exporter/utils/path-resolver.ts
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

/**
 * Converts absolute workspace file or directory paths into compact display representations.
 * If the path is a Java file, formats it as package.ClassName.
 */
export function formatPathForDisplay(absPath: string, workspaceRoot: string): string {
  if (!absPath || !absPath.trim()) return '';
  const cleanAbs = absPath.replace(/^['"]|['"]$/g, '').trim();
  const normalizedAbs = cleanAbs.replace(/\\/g, '/');
  const normalizedWs = workspaceRoot ? workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';

  // Check if file/folder resides within current workspace root
  if (normalizedWs && normalizedAbs.startsWith(normalizedWs)) {
    let rel = normalizedAbs.slice(normalizedWs.length).replace(/^\/+/, '');

    // Java package.ClassName formatting
    if (rel.endsWith('.java')) {
      const javaRoots = ['src/main/java/', 'src/test/java/', 'src/java/', 'java/'];
      let pkgPath = rel;
      for (const root of javaRoots) {
        if (rel.includes(root)) {
          pkgPath = rel.substring(rel.indexOf(root) + root.length);
          break;
        }
      }
      return pkgPath.replace(/\.java$/, '').replace(/\//g, '.');
    }

    return rel || '.';
  }

  return cleanAbs;
}

export class PathMappingService {
  private static map: Map<string, string> = new Map();

  /**
   * Registers a path mapping from display string to original absolute path.
   */
  public static registerPath(absPath: string, workspaceRoot: string): string {
    if (!absPath) return '';
    const clean = absPath.trim();
    if (!clean) return '';

    const display = formatPathForDisplay(clean, workspaceRoot);
    if (display && clean) {
      this.map.set(display, clean);
      this.map.set(display.toLowerCase(), clean);
      this.map.set(clean, clean);
      this.map.set(clean.toLowerCase(), clean);
    }
    return display;
  }

  /**
   * Resolves a display string (relative, package notation, or exact text) back to its absolute path.
   */
  public static resolveToAbsolute(displayOrAbs: string, workspaceRoot: string): string {
    const trimmed = displayOrAbs.trim();
    if (!trimmed) return '';

    if (this.map.has(trimmed)) {
      return this.map.get(trimmed)!;
    }
    if (this.map.has(trimmed.toLowerCase())) {
      return this.map.get(trimmed.toLowerCase())!;
    }

    // Convert Java package.ClassName back if possible
    if (trimmed.includes('.') && !trimmed.includes('/') && !trimmed.includes('\\') && workspaceRoot) {
      const javaRel = 'src/main/java/' + trimmed.replace(/\./g, '/') + '.java';
      return `${workspaceRoot.replace(/[/\\]+$/, '')}/${javaRel}`;
    }

    // Relative workspace path fallback
    if (workspaceRoot && !trimmed.startsWith('/') && !trimmed.match(/^[a-zA-Z]:/)) {
      return `${workspaceRoot.replace(/[/\\]+$/, '')}/${trimmed}`;
    }

    return trimmed;
  }

  public static clearMap(): void {
    this.map.clear();
  }
}
EOF

# 2. Update use-export-configuration.ts to split by comma/newline (preserving spaces in paths) and register display rules
cat << 'EOF' > webview/src/features/exporter/hooks/use-export-configuration.ts
import { useEffect } from 'react';
import { useExporterStore } from '../store/useExporterStore';
import { filesExporterHistoryApiService } from '@/services/api/files-exporter-history-api.service.gen';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '../utils/log-info';
import { PathMappingService } from '../utils/path-resolver';

export function useExportConfiguration() {
  const store = useExporterStore();

  const addPathsToConfig = (absPaths: string[]) => {
    const wsRoot = store.workspaceRoot;
    // Split input paths on commas or newlines without splitting on spaces within paths
    const expandedList = absPaths
      .flatMap((p) => String(p).split(/[,\n\r]+/))
      .map((s) => s.trim())
      .filter(Boolean);

    const formattedList = expandedList
      .map((p) => PathMappingService.registerPath(p, wsRoot))
      .filter(Boolean);

    store.setConfig((prev) => {
      const current = prev.src
        ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)
        : [];
      const combined = Array.from(new Set([...current, ...formattedList]));
      return { ...prev, src: combined.join('\n') };
    });
  };

  useEffect(() => {
    logInfo('[useExportConfiguration] Initializing exporter configuration hook...');
    store.fetchInitialState();

    vsCodeApiService.getRepoName().then((repo) => {
      logInfo('[useExportConfiguration] Active repository:', repo);
    }).catch(() => {});

    const unsubscribeSelectedPath = vsCodeHandleMessage.on('selectedPath', (msg) => {
      if (msg.payload) {
        logInfo('[useExportConfiguration] Received selectedPath message', msg.payload);
        const newPaths = String(msg.payload).split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
        addPathsToConfig(newPaths);
      }
    });

    const unsubscribeUpdatePaths = vsCodeHandleMessage.on('updatePaths', (msg) => {
      if (Array.isArray(msg.paths)) {
        logInfo('[useExportConfiguration] Received updatePaths message', msg.paths);
        const newPaths = msg.paths.flatMap((p) => String(p).split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
        addPathsToConfig(newPaths);
      }
    });

    return () => {
      unsubscribeSelectedPath();
      unsubscribeUpdatePaths();
    };
  }, [store.workspaceRoot]);

  // Perform path existence validation whenever source paths or workspace root changes
  useEffect(() => {
    const displayLines = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    if (displayLines.length === 0) {
      store.setInvalidPaths([]);
      return;
    }

    const resolvedAbsPaths = displayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

    fileSystemApiService
      .getInvalidPaths(resolvedAbsPaths, store.workspaceRoot)
      .then((invalid) => {
        store.setInvalidPaths(invalid || []);
      })
      .catch(() => {});
  }, [store.config.src, store.workspaceRoot]);

  useEffect(() => {
    const displayLines = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
    const resolvedAbsPaths = displayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));
    const paths = resolvedAbsPaths.join(',');

    const cmd = `python3 files-exporter.py --src '${paths || '.'}' --dest '${store.config.dest}' --format '${store.config.format}' --max-file ${store.config.max_file} --max-chunk ${store.config.max_chunk}${
      store.config.groupByExt ? ' --group-ext' : ''
    }${store.config.logConsole ? ' --log-console' : ''}${store.config.generateTreeView ? ' --tree-view' : ''}`;
    store.setCompiledBashCmd(cmd);
  }, [store.config, store.workspaceRoot]);

  const handleAddOpenFiles = async () => {
    logInfo('[useExportConfiguration] handleAddOpenFiles starting...');
    try {
      const currentDisplayLines = store.config.src ? store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const openFiles = await filesExporterApiService.getOpenEditorFiles(currentAbsPaths);
      addPathsToConfig(openFiles);
      filesExporterApiService.showNotification('info', `Added open editor files (${openFiles.length} total paths)`);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error adding open files:', err);
    }
  };

  const handleAddGitDiffFiles = async () => {
    logInfo('[useExportConfiguration] handleAddGitDiffFiles starting...');
    try {
      const currentDisplayLines = store.config.src ? store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
      const currentAbsPaths = currentDisplayLines.map((line) => PathMappingService.resolveToAbsolute(line, store.workspaceRoot));

      const gitFiles = await filesExporterApiService.getGitDiffFiles(currentAbsPaths);
      addPathsToConfig(gitFiles);
      filesExporterApiService.showNotification('info', `Added modified Git files (${gitFiles.length} total paths)`);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error adding Git diff files:', err);
    }
  };

  const handleCopyLatestFiles = async () => {
    logInfo('[useExportConfiguration] handleCopyLatestFiles starting...', store.config.dest);
    try {
      const res = await filesExporterApiService.copyLatestExportedFiles(store.config.dest);
      filesExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error copying latest files:', err);
    }
  };

  const handleClearDestDir = async () => {
    logInfo('[useExportConfiguration] handleClearDestDir starting...', store.config.dest);
    try {
      const res = await filesExporterApiService.clearDestDirectory(store.config.dest);
      filesExporterApiService.showNotification(res.success ? 'info' : 'warn', res.message);
    } catch (err: any) {
      logInfo('[useExportConfiguration] Error clearing dest dir:', err);
    }
  };

  const handleOpenErrorModal = () => {
    logInfo('[useExportConfiguration] handleOpenErrorModal starting...');
    store.setModalState({ isErrorModalOpen: true });
  };

  const handleCloseErrorModal = () => {
    logInfo('[useExportConfiguration] handleCloseErrorModal starting...');
    store.setModalState({ isErrorModalOpen: false });
  };

  const handleOpenHistoryFile = async () => {
    logInfo('[useExportConfiguration] handleOpenHistoryFile starting...');
    await filesExporterHistoryApiService.openHistoryFile();
  };

  const handleRevealHistoryFolder = async () => {
    logInfo('[useExportConfiguration] handleRevealHistoryFolder starting...');
    await filesExporterHistoryApiService.revealHistoryFile();
  };

  const handleRevealDestination = async () => {
    logInfo('[useExportConfiguration] handleRevealDestination starting...', store.config.dest);
    await filesExporterApiService.openPathAtCursor(store.config.dest);
  };

  const handleOpenCursorLinePath = async () => {
    logInfo('[useExportConfiguration] handleOpenCursorLinePath starting...');
    const firstLine = store.config.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean)[0];
    if (firstLine) {
      const absPath = PathMappingService.resolveToAbsolute(firstLine, store.workspaceRoot);
      await filesExporterApiService.openPathAtCursor(absPath);
    }
  };

  return {
    ...store,
    addPathsToConfig,
    handleSelectProfile: async (id: string) => {
      logInfo('[useExportConfiguration] handleSelectProfile starting...', id);
      await store.selectProfile(id);
    },
    handleFreezeToggle: async (id: string) => {
      logInfo('[useExportConfiguration] handleFreezeToggle starting...', id);
      await store.freezeToggle(id);
    },
    handleResetConfig: () => {
      logInfo('[useExportConfiguration] handleResetConfig starting...');
      store.resetConfig();
    },
    handleRenameProfile: async (id: string, newName: string) => {
      logInfo('[useExportConfiguration] handleRenameProfile starting...', { id, newName });
      await store.renameProfile(id, newName);
    },
    handleDuplicateProfile: async (id: string) => {
      logInfo('[useExportConfiguration] handleDuplicateProfile starting...', id);
      await store.duplicateProfile(id);
    },
    handleAddProfile: async () => {
      logInfo('[useExportConfiguration] handleAddProfile starting...');
      await store.addProfile();
    },
    handleClearHistory: async () => {
      logInfo('[useExportConfiguration] handleClearHistory starting...');
      await store.clearHistoryWithMode('clear-all-hard');
    },
    handleAddOpenFiles,
    handleAddGitDiffFiles,
    handleCopyLatestFiles,
    handleClearDestDir,
    handleOpenErrorModal,
    handleCloseErrorModal,
    handleOpenHistoryFile,
    handleRevealHistoryFolder,
    handleRevealDestination,
    handleOpenCursorLinePath,
  };
}
EOF

# 3. Update SourcePathsSection.tsx to convert comma-separated inputs on edit/paste while respecting short display path conversion
cat << 'EOF' > webview/src/features/exporter/components/SourcePathsSection.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileCode, GitCompare, Bug, ExternalLink, Trash2, X } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { useExporterStore } from '../store/useExporterStore';
import { PathMappingService } from '../utils/path-resolver';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { logInfo } from '../utils/log-info';

interface SourcePathsSectionProps {
  pathsText: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChangePathsText: (text: string) => void;
  onAddOpenFiles: () => void;
  onAddGitDiffFiles: () => void;
  onAddErrorStackFiles: () => void;
  onOpenCursorLinePath: () => void;
  onClearPaths: () => void;
}

export const SourcePathsSection: React.FC<SourcePathsSectionProps> = ({
  pathsText,
  isOpen = true,
  onOpenChange,
  onChangePathsText,
  onAddOpenFiles,
  onAddGitDiffFiles,
  onAddErrorStackFiles,
  onOpenCursorLinePath,
  onClearPaths,
}) => {
  const workspaceRoot = useExporterStore((s) => s.workspaceRoot);
  const invalidPaths = useExporterStore((s) => s.invalidPaths);

  const lines = pathsText.split(/[,\n\r]+/).map((l) => l.trim()).filter(Boolean);

  const handleRemovePath = (lineToRemove: string) => {
    logInfo('[SourcePathsSection] handleRemovePath triggered', lineToRemove);
    const newLines = lines.filter((l) => l !== lineToRemove);
    onChangePathsText(newLines.join('\n'));
  };

  const summaryBadges: BadgeObject[] = lines.flatMap((line) => {
    const clean = line.replace(/^['"]|['"]$/g, '').trim();
    if (!clean) return [];

    const absPath = PathMappingService.resolveToAbsolute(clean, workspaceRoot);
    const normAbs = absPath.replace(/\\/g, '/');
    const normWs = workspaceRoot ? workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';

    const isExternal = Boolean(normWs && !normAbs.startsWith(normWs));
    const isFile = Boolean(clean.includes('.') && !clean.endsWith('/') && !clean.endsWith('\\'));

    const isInvalid = invalidPaths.some(
      (inv) =>
        inv === clean ||
        inv === absPath ||
        inv.replace(/\\/g, '/') === normAbs ||
        inv.toLowerCase() === clean.toLowerCase()
    );

    const parts = normAbs.split('/').filter(Boolean);
    let folderPart = '';
    let filePart = clean;

    if (parts.length >= 2) {
      folderPart = `${parts[parts.length - 2]}/`;
      filePart = parts[parts.length - 1];
    } else if (parts.length === 1) {
      filePart = parts[0];
    }

    const fullDisplay = `${folderPart}${filePart}`;

    const onClick = () => {
      logInfo('[SourcePathsSection] Single click on badge -> revealInExplorer & copyToClipboard', absPath);
      vsCodeApiService.revealInExplorer(absPath);
      vsCodeApiService.copyToClipboard(absPath);
      filesExporterApiService.showNotification('info', `Path copied to clipboard: ${absPath}`);
    };

    const onDoubleClick = () => {
      if (isFile) {
        logInfo('[SourcePathsSection] Double click on file badge -> openFile', absPath);
        vsCodeApiService.openFile(absPath);
      }
    };

    const actionTooltip = isFile
      ? 'Single-click to copy path & reveal in Explorer, Double-click to open file'
      : 'Single-click to copy path & reveal folder in Explorer';

    // 1. Non-existing path -> Destructive color (red) with removal cross icon
    if (isInvalid) {
      return [
        {
          label: (
            <div className="flex items-center gap-1 min-w-0 max-w-full">
              <span className="[direction:rtl] text-left truncate min-w-0 flex-1">
                {fullDisplay}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePath(line);
                }}
                className="hover:bg-destructive/20 rounded p-0.5 shrink-0 transition-colors cursor-pointer"
                data-tooltip="Remove invalid path from list"
              >
                <X size={11} />
              </button>
            </div>
          ),
          tooltip: `Invalid Path (Does not exist on disk): ${absPath}`,
          className:
            'bg-destructive/10 text-destructive border-destructive/30 font-semibold max-w-[280px] sm:max-w-[1000px] min-w-0',
        },
      ];
    }

    // 2. External workspace existing path -> Amber color
    if (isExternal) {
      return [
        {
          label: (
            <span className="[direction:rtl] text-left truncate block min-w-0">
              {fullDisplay}
            </span>
          ),
          tooltip: `External Path: ${absPath}<br/>(${actionTooltip})`,
          className:
            'bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold max-w-[280px] sm:max-w-[1000px] min-w-0',
          onClick,
          onDoubleClick,
        },
      ];
    }

    // 3. Workspace existing path ending with filename -> Full Emerald (bg, fg, border)
    if (isFile) {
      return [
        {
          label: (
            <span className="[direction:rtl] text-left truncate block min-w-0">
              {fullDisplay}
            </span>
          ),
          tooltip: `Workspace File: ${absPath}<br/>(${actionTooltip})`,
          className:
            'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold max-w-[280px] sm:max-w-[1000px] min-w-0',
          onClick,
          onDoubleClick,
        },
      ];
    }

    // 4. Workspace existing folder -> Common Blue color
    return [
      {
        label: (
          <span className="[direction:rtl] text-left truncate block min-w-0">
            {fullDisplay}
          </span>
        ),
        tooltip: `Workspace Folder: ${absPath}<br/>(${actionTooltip})`,
        className:
          'bg-primary/10 text-primary border-primary/20 font-semibold max-w-[280px] sm:max-w-[1000px] min-w-0',
        onClick,
        onDoubleClick,
      },
    ];
  });

  const totalPathsBadge = (
    <span
      className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none"
      data-tooltip={`${lines.length} total ${lines.length === 1 ? 'path' : 'paths'} selected`}
    >
      {lines.length} {lines.length === 1 ? 'path' : 'paths'}
    </span>
  );

  const handleAddOpenFiles = () => {
    logInfo('[SourcePathsSection] onAddOpenFiles handler triggered');
    onAddOpenFiles();
  };

  const handleAddGitDiffFiles = () => {
    logInfo('[SourcePathsSection] onAddGitDiffFiles handler triggered');
    onAddGitDiffFiles();
  };

  const handleAddErrorStackFiles = () => {
    logInfo('[SourcePathsSection] onAddErrorStackFiles handler triggered');
    onAddErrorStackFiles();
  };

  const handleOpenCursorLinePath = () => {
    logInfo('[SourcePathsSection] onOpenCursorLinePath handler triggered');
    onOpenCursorLinePath();
  };

  const handleClearPaths = () => {
    logInfo('[SourcePathsSection] onClearPaths handler triggered');
    onClearPaths();
  };

  const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value;
    if (rawVal.includes(',')) {
      const splitList = rawVal
        .split(/[,\n\r]+/)
        .map((s) => s.trim())
        .filter(Boolean);
      const formattedList = splitList.map((p) => PathMappingService.registerPath(p, workspaceRoot));
      onChangePathsText(Array.from(new Set(formattedList)).join('\n'));
    } else {
      onChangePathsText(rawVal);
    }
  };

  return (
    <CollapsibleCard
      id="block-sourcepaths"
      title="📁 Source Paths"
      tooltip="Absolute directory or single files locations targeted for aggregation and token estimation context."
      summaryBadges={summaryBadges}
      headerRight={totalPathsBadge}
      defaultOpen={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0"
    >
      <div className="flex items-start gap-2 font-mono text-xs">
        <Textarea
          value={pathsText}
          onChange={handleChangeTextarea}
          placeholder="Enter source directories, files, or Java package.ClassName (one per line or comma-separated)..."
          rows={6}
          className="flex-1 bg-background h-[138px] font-mono text-xs resize-y"
        />

        <div className="flex flex-col gap-1 shrink-0">
          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleAddOpenFiles}
            data-tooltip="Add Currently Open Editor Files"
          >
            <FileCode size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleAddGitDiffFiles}
            data-tooltip="Add Modified Files from Git Diff"
          >
            <GitCompare size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleAddErrorStackFiles}
            data-tooltip="Extract References from Crash Stack Trace"
          >
            <Bug size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleOpenCursorLinePath}
            data-tooltip="Open Target Path at Cursor Line"
          >
            <ExternalLink size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleClearPaths}
            data-tooltip="Clear Source Paths"
            className="hover:text-destructive"
          >
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default SourcePathsSection;
EOF

# 4. Update ExporterPanel.tsx to register paths with PathMappingService when added via tabs
cat << 'EOF' > webview/src/features/exporter/components/ExporterPanel.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useExporterExecution } from '../hooks/use-exporter-execution';
import { useExporterStore } from '../store/useExporterStore';
import { ActionToolbar } from './ActionToolbar';
import { ReportTab } from './tabs/ReportTab';
import { FilesTab } from './tabs/FilesTab';
import { TerminalTab } from './tabs/TerminalTab';
import { HelpTab } from './tabs/HelpTab';
import { SimulationTab } from './tabs/SimulationTab';
import { TreeTab } from './tabs/TreeTab';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { ExporterTabId } from '../types/exporter.types';
import { PathMappingService } from '../utils/path-resolver';
import { logInfo } from '../utils/log-info';

export function ExporterPanel() {
  const {
    isRunning,
    handleRunExport,
    handleKillExport,
    handleOpenExchangeUrl,
    compiledBashCmd,
    terminalLogs,
    clearTerminalLogs,
    reportData,
    activeTab,
    setActiveTab,
    exchangeLinks,
  } = useExporterExecution();

  const { config, setConfig, workspaceRoot } = useExporterStore();

  const handleTabChange = (val: string) => {
    logInfo('[ExporterPanel] Active tab changed', val);
    setActiveTab(val as ExporterTabId);
  };

  const topContent = (
    <ActionToolbar
      isRunning={isRunning}
      onRunExport={handleRunExport}
      onKillExport={handleKillExport}
      onOpenExchangeUrl={handleOpenExchangeUrl}
      exchangeLinks={exchangeLinks}
    />
  );

  const middleContent = (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="flex-1 flex flex-col h-full min-h-0 p-2 overflow-hidden"
    >
      <TabsList className="bg-muted p-1 border-b border-border flex-wrap h-auto gap-1 shrink-0">
        <TabsTrigger value="report" className="text-xs font-mono font-bold">REPORT</TabsTrigger>
        <TabsTrigger value="files" className="text-xs font-mono font-bold">FILES</TabsTrigger>
        <TabsTrigger value="tree" className="text-xs font-mono font-bold">TREE MANIFEST</TabsTrigger>
        <TabsTrigger value="terminal" className="text-xs font-mono font-bold">TERMINAL</TabsTrigger>
        <TabsTrigger value="help" className="text-xs font-mono font-bold">HELP</TabsTrigger>
        <TabsTrigger value="simu" className="text-xs font-mono font-bold">SIMULATION B</TabsTrigger>
      </TabsList>

      <div className="flex-1 min-h-0 overflow-y-auto mt-2">
        <TabsContent value="report" className="h-full m-0">
          <ReportTab
            reportData={reportData}
            onAppendExtension={(ext, mode) => {
              logInfo('[ExporterPanel] onAppendExtension', { ext, mode });
              const field = mode === 'inc' ? 'inc_ext' : 'exc_ext';
              setConfig((prev) => ({
                ...prev,
                [field]: prev[field] ? `${prev[field]}\n.*\\.${ext}$` : `.*\\.${ext}$`,
              }));
            }}
            onSetMaxFileSize={(kb) => {
              logInfo('[ExporterPanel] onSetMaxFileSize', kb);
              setConfig((prev) => ({ ...prev, max_file: String(kb) }));
            }}
          />
        </TabsContent>

        <TabsContent value="files" className="h-full m-0">
          <FilesTab
            reportData={reportData}
            destDir={config.dest}
            onOpenFile={(p) => {
              logInfo('[ExporterPanel] FilesTab onOpenFile', p);
              filesExporterApiService.openPathAtCursor(p);
            }}
            onRevealFile={(p) => {
              logInfo('[ExporterPanel] FilesTab onRevealFile', p);
              filesExporterApiService.openPathAtCursor(p);
            }}
          />
        </TabsContent>

        <TabsContent value="tree" className="h-full m-0">
          <TreeTab
            rootNode={reportData?.tree_manifest?.root || null}
            onExcludePattern={(pattern) => {
              logInfo('[ExporterPanel] TreeTab onExcludePattern', pattern);
              setConfig((prev) => ({
                ...prev,
                exc_paths: prev.exc_paths ? `${prev.exc_paths}\n${pattern}` : pattern,
              }));
            }}
            onCaptureSelectedPaths={(paths) => {
              logInfo('[ExporterPanel] TreeTab onCaptureSelectedPaths', paths);
              if (paths.length > 0) {
                setConfig((prev) => {
                  const current = prev.src ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
                  const flatNew = paths.flatMap((p) => p.split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
                  const formatted = flatNew.map((p) => PathMappingService.registerPath(p, workspaceRoot));
                  return { ...prev, src: Array.from(new Set([...current, ...formatted])).join('\n') };
                });
              }
            }}
          />
        </TabsContent>

        <TabsContent value="terminal" className="h-full m-0">
          <TerminalTab
            compiledBashCmd={compiledBashCmd}
            terminalLogs={terminalLogs}
            onCopyBashCmd={() => {
              logInfo('[ExporterPanel] TerminalTab onCopyBashCmd');
              filesExporterApiService.showNotification('info', 'Command copied to clipboard');
            }}
            onCopyTerminalLogs={() => {
              logInfo('[ExporterPanel] TerminalTab onCopyTerminalLogs');
              filesExporterApiService.showNotification('info', 'Logs copied to clipboard');
            }}
            onClearTerminalLogs={() => {
              logInfo('[ExporterPanel] TerminalTab onClearTerminalLogs');
              clearTerminalLogs();
            }}
          />
        </TabsContent>

        <TabsContent value="help" className="h-full m-0">
          <HelpTab />
        </TabsContent>

        <TabsContent value="simu" className="h-full m-0">
          <SimulationTab
            onInjectPaths={(paths) => {
              logInfo('[ExporterPanel] SimulationTab onInjectPaths', paths);
              setConfig((prev) => {
                const current = prev.src ? prev.src.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean) : [];
                const flatNew = paths.flatMap((p) => p.split(/[,\n\r]+/)).map((s) => s.trim()).filter(Boolean);
                const formatted = flatNew.map((p) => PathMappingService.registerPath(p, workspaceRoot));
                return { ...prev, src: Array.from(new Set([...current, ...formatted])).join('\n') };
              });
            }}
          />
        </TabsContent>
      </div>
    </Tabs>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-exporter-execution"
      className="bg-background w-full h-full min-h-0 overflow-hidden"
      top={topContent}
      middle={middleContent}
    />
  );
}

export default ExporterPanel;
EOF

echo "✅ fix: Corrected path splitting by using comma/linefeed regex (/[,\n\r]+/) without splitting on spaces, ensuring absolute path mappings and short display rules are preserved!"
echo "💡 Next step: Execute 'cd webview && npm run build' to confirm build succeeds."

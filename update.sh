#!/usr/bin/env bash
set -e

# Create necessary component directories
mkdir -p webview/src/features/exporter/components
mkdir -p webview/src/features/exporter/components/tabs

# Update DestinationSection.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/DestinationSection.tsx
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy, FolderOpen, Trash2 } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { useExporterStore } from '../store/useExporterStore';
import { PathMappingService } from '../utils/path-resolver';
import { fileSystemApiService } from '@/services/api/file-system-api.service.gen';
import { logInfo } from '../utils/log-info';

interface DestinationSectionProps {
  destDir: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChangeDestDir: (dir: string) => void;
  onCopyLatestFiles: () => void;
  onRevealDestDir: () => void;
  onClearDestDir: () => void;
}

export const DestinationSection: React.FC<DestinationSectionProps> = ({
  destDir,
  isOpen,
  onOpenChange,
  onChangeDestDir,
  onCopyLatestFiles,
  onRevealDestDir,
  onClearDestDir,
}) => {
  const workspaceRoot = useExporterStore((s) => s.workspaceRoot);
  const [destExists, setDestExists] = useState<boolean>(true);

  const handleCopyLatestFiles = () => {
    logInfo('[DestinationSection] onCopyLatestFiles handler triggered', destDir);
    onCopyLatestFiles();
  };

  const handleRevealDestDir = () => {
    logInfo('[DestinationSection] onRevealDestDir handler triggered', destDir);
    onRevealDestDir();
  };

  const handleClearDestDir = () => {
    logInfo('[DestinationSection] onClearDestDir handler triggered', destDir);
    onClearDestDir();
  };

  const formattedDest = destDir || 'Default directory';
  const absDest = PathMappingService.resolveToAbsolute(formattedDest, workspaceRoot);

  useEffect(() => {
    if (!absDest || !absDest.trim()) {
      setDestExists(false);
      return;
    }

    fileSystemApiService
      .getInvalidPaths([absDest], workspaceRoot)
      .then((invalid) => {
        const isInvalid = Boolean(invalid && invalid.length > 0);
        setDestExists(!isInvalid);
      })
      .catch(() => {
        setDestExists(true);
      });
  }, [absDest, workspaceRoot]);

  const normDest = absDest.replace(/\\/g, '/');
  const normWs = workspaceRoot ? workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';
  const isExternal = Boolean(normWs && !normDest.startsWith(normWs));

  let tooltip = formattedDest;
  if (!destExists) {
    tooltip = `⚠️ Warning because you have defined an non existing folder. <br> It will be created automatically`;
  } else if (isExternal) {
    tooltip = `⚠️ Warning: You reference a destination directory outside the current workspace: ${absDest}`;
  }

  const isWarning = !destExists || isExternal;

  const badgeClassName = isWarning
    ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold [direction:rtl] text-left w-full min-w-0 truncate'
    : 'bg-primary/10 text-primary border-primary/20 [direction:rtl] text-left w-full min-w-0 truncate';

  const summaryBadges: BadgeObject[] = [
    {
      label: formattedDest,
      tooltip,
      className: badgeClassName,
    },
  ];

  return (
    <CollapsibleCard
      id="block-destination"
      title="💾 Destination Directory"
      tooltip="Absolute distribution path folder location where structured files will be generated."
      summaryBadges={summaryBadges}
      defaultOpen={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0"
    >
      <div className="flex gap-1.5 items-center font-mono text-xs">
        <Input
          value={destDir}
          onChange={(e) => onChangeDestDir(e.target.value)}
          placeholder="/absolute/path/to/exported-files"
          className="h-7 text-xs font-mono flex-1 bg-background"
        />

        <Button
          size="icon-xs"
          variant="outline"
          onClick={handleCopyLatestFiles}
          data-tooltip="Copy Last Exported Files to Clipboard"
        >
          <Copy size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="outline"
          onClick={handleRevealDestDir}
          data-tooltip="Reveal Folder in OS Explorer"
        >
          <FolderOpen size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="outline"
          onClick={handleClearDestDir}
          data-tooltip="Clean Destination Folder Contents"
          className="hover:text-destructive"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </CollapsibleCard>
  );
};

export default DestinationSection;
EOF

# Update SourcePathsSection.tsx: Replace native title with data-tooltip
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

  const lines = pathsText.split('\n').map((l) => l.trim()).filter(Boolean);

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
          onChange={(e) => onChangePathsText(e.target.value)}
          placeholder="Enter source directories, files, or Java package.ClassName (one per line)..."
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

# Update HistoryBar.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/HistoryBar.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, RotateCcw, Edit2, Copy, Plus, FileText, FolderOpen, Trash2 } from 'lucide-react';
import { HistoryEntry } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '../utils/log-info';

interface HistoryBarProps {
  historyList: HistoryEntry[];
  selectedProfileId: string;
  onSelectProfile: (id: string) => void;
  onFreezeToggle: (id: string) => void;
  onResetConfig: () => void;
  onRenameProfile: (id: string, newName: string) => void;
  onDuplicateProfile: (id: string) => void;
  onAddProfile: () => void;
  onOpenFile: () => void;
  onRevealFolder: () => void;
  onClearHistory: () => void;
}

export const HistoryBar: React.FC<HistoryBarProps> = ({
  historyList,
  selectedProfileId,
  onSelectProfile,
  onFreezeToggle,
  onResetConfig,
  onRenameProfile,
  onDuplicateProfile,
  onAddProfile,
  onOpenFile,
  onRevealFolder,
  onClearHistory,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [renameText, setRenameText] = useState('');

  const selectedEntry = historyList.find((h) => h.id === selectedProfileId);
  const isDefault = selectedProfileId === 'default';

  const handleSelectProfile = (id: string) => {
    logInfo('[HistoryBar] onSelectProfile handler triggered', id);
    onSelectProfile(id);
  };

  const handleFreezeToggle = () => {
    logInfo('[HistoryBar] onFreezeToggle handler triggered', selectedProfileId);
    onFreezeToggle(selectedProfileId);
  };

  const handleResetConfig = () => {
    logInfo('[HistoryBar] onResetConfig handler triggered', selectedProfileId);
    onResetConfig();
  };

  const handleStartRename = () => {
    logInfo('[HistoryBar] handleStartRename triggered', selectedProfileId);
    if (selectedEntry) {
      setRenameText(selectedEntry.display);
      setIsEditing(true);
    }
  };

  const handleConfirmRename = () => {
    logInfo('[HistoryBar] handleConfirmRename triggered', { selectedProfileId, renameText });
    if (selectedProfileId && renameText.trim()) {
      onRenameProfile(selectedProfileId, renameText.trim());
    }
    setIsEditing(false);
  };

  const handleDuplicateProfile = () => {
    logInfo('[HistoryBar] onDuplicateProfile handler triggered', selectedProfileId);
    onDuplicateProfile(selectedProfileId);
  };

  const handleAddProfile = () => {
    logInfo('[HistoryBar] onAddProfile handler triggered');
    onAddProfile();
  };

  const handleOpenFile = () => {
    logInfo('[HistoryBar] onOpenFile handler triggered');
    onOpenFile();
  };

  const handleRevealFolder = () => {
    logInfo('[HistoryBar] onRevealFolder handler triggered');
    onRevealFolder();
  };

  const handleClearHistory = () => {
    logInfo('[HistoryBar] onClearHistory handler triggered');
    onClearHistory();
  };

  return (
    <div className="flex items-center gap-1.5 bg-card px-2 w-full min-w-0 font-mono text-xs select-none">
      <span className="font-bold text-[11px] text-foreground shrink-0">Profile:</span>

      {isEditing ? (
        <Input
          value={renameText}
          onChange={(e) => setRenameText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirmRename();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          className="flex-1 h-7 font-mono text-xs"
          autoFocus
        />
      ) : (
        <Select
          value={selectedProfileId}
          onValueChange={(val: string | null) => {
            if (val) handleSelectProfile(val);
          }}
        >
          <SelectTrigger className="flex-1 bg-background h-7 font-mono text-xs">
            <SelectValue placeholder="Select Configuration Profile..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">Default Configuration</SelectItem>
            {historyList.map((entry) => (
              <SelectItem key={entry.id} value={entry.id}>
                {entry.frozen ? '🔒 ' : ''}{entry.display}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <div className="flex items-center gap-1 shrink-0">
        {!isDefault && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleFreezeToggle}
            data-tooltip={selectedEntry?.frozen ? 'Unfreeze Profile' : 'Freeze Profile'}
          >
            {selectedEntry?.frozen ? <Lock size={13} className="text-amber-500" /> : <Unlock size={13} />}
          </Button>
        )}

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleResetConfig}
          data-tooltip="Reset Configuration"
        >
          <RotateCcw size={13} />
        </Button>

        {!isDefault && !selectedEntry?.frozen && (
          <Button
            size="icon-xs"
            variant="ghost"
            onClick={handleStartRename}
            data-tooltip="Rename Profile"
          >
            <Edit2 size={13} />
          </Button>
        )}

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleDuplicateProfile}
          data-tooltip="Duplicate Configuration"
        >
          <Copy size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleAddProfile}
          data-tooltip="New Blank Profile"
        >
          <Plus size={13} />
        </Button>

        <div className="mx-0.5 bg-border w-[1px] h-4" />

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleOpenFile}
          data-tooltip="Open History File"
        >
          <FileText size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleRevealFolder}
          data-tooltip="Reveal History Folder"
        >
          <FolderOpen size={13} />
        </Button>

        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleClearHistory}
          data-tooltip="Clear History Entries"
          className="hover:text-destructive"
        >
          <Trash2 size={13} />
        </Button>
      </div>
    </div>
  );
};

export default HistoryBar;
EOF

# Update FiltersSection.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/FiltersSection.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowDownAZ, ArrowUpAZ, UnfoldVertical, Library, Trash2, MoreVertical } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { FILE_EXT_CATEGORY_GROUPS } from '../constants/exporter-constants';
import { testFilterPatterns } from '../utils/filter-simulator';
import { explodeTextAreaRegex, groupExtensionsText } from '../utils/regex-exploder';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '../utils/log-info';

interface FiltersSectionProps {
  config: ExportConfig;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChangeConfig: (updater: (prev: ExportConfig) => ExportConfig) => void;
  filterSimulatorInput: string;
  setFilterSimulatorInput: (val: string) => void;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  config,
  isOpen,
  onOpenChange,
  onChangeConfig,
  filterSimulatorInput,
  setFilterSimulatorInput,
}) => {
  const [sortDirections, setSortDirections] = useState<Record<string, 'asc' | 'desc'>>({
    inc_paths: 'asc',
    inc_ext: 'asc',
    exc_paths: 'asc',
    exc_ext: 'asc',
  });

  const simResult = testFilterPatterns(
    filterSimulatorInput,
    config.inc_paths,
    config.exc_paths,
    config.inc_ext,
    config.exc_ext
  );

  const separator = '\n';
  const incPathLines = config.inc_paths.split(separator).map((s) => s.trim()).filter(Boolean);
  const incExtLines = config.inc_ext.split(separator).map((s) => s.trim()).filter(Boolean);
  const excPathLines = config.exc_paths.split(separator).map((s) => s.trim()).filter(Boolean);
  const excExtLines = config.exc_ext.split(separator).map((s) => s.trim()).filter(Boolean);

  const combinedSeparator = ' 📏 ';
  const incPathCombined = incPathLines.join(combinedSeparator);
  const incExtCombined = incExtLines.join(combinedSeparator);
  const excPathCombined = excPathLines.join(combinedSeparator);
  const excExtCombined = excExtLines.join(combinedSeparator);

  const tooltipSeparator = '<br>';
  const incPathTooltip = incPathLines.join(tooltipSeparator);
  const incExtTooltip = incExtLines.join(tooltipSeparator);
  const excPathTooltip = excPathLines.join(tooltipSeparator);
  const excExtTooltip = excExtLines.join(tooltipSeparator);

  const summaryBadges: BadgeObject[] = [
    {
      label: `Max file: ${config.max_file} KB`,
      tooltip: `Max file size limit: ${config.max_file} KB`,
      className: 'bg-primary/10 text-primary border-primary/20 shrink-0 font-bold',
    },
  ];

  if (incPathCombined) {
    summaryBadges.push({
      label: `Inc Path: ${incPathCombined}`,
      tooltip: `<strong>Inc Path:</strong> <br> ${incPathTooltip}`,
      className: 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }
  if (incExtCombined) {
    summaryBadges.push({
      label: `Inc Ext: ${incExtCombined}`,
      tooltip: `<strong>Inc Ext:</strong> <br> ${incExtTooltip}`,
      className: 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }
  if (excPathCombined) {
    summaryBadges.push({
      label: `Exc Path: ${excPathCombined}`,
      tooltip: `<strong>Exc Path:</strong> <br> ${excPathTooltip}`,
      className: 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }
  if (excExtCombined) {
    summaryBadges.push({
      label: `Exc Ext: ${excExtCombined}`,
      tooltip: `<strong>Exc Ext:</strong> <br> ${excExtTooltip}`,
      className: 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }

  const toggleSortLines = (field: keyof ExportConfig) => {
    const currentDir = sortDirections[field] || 'asc';
    const nextDir = currentDir === 'asc' ? 'desc' : 'asc';
    setSortDirections((prev) => ({ ...prev, [field]: nextDir }));

    logInfo('[FiltersSection] toggleSortLines handler triggered', { field, direction: nextDir });

    onChangeConfig((prev) => {
      const val = String(prev[field] || '');
      const lines = val.split('\n').map((l) => l.trim()).filter(Boolean);

      const commentLines = lines.filter((l) => l.startsWith('#'));
      const activeLines = lines.filter((l) => !l.startsWith('#'));

      activeLines.sort((a, b) => (nextDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));

      const combined = [...commentLines, ...activeLines];
      return { ...prev, [field]: combined.join('\n') };
    });
  };

  const explodeRegex = (field: keyof ExportConfig) => {
    logInfo('[FiltersSection] explodeRegex handler triggered', field);
    onChangeConfig((prev) => {
      const val = String(prev[field] || '');
      const exploded = explodeTextAreaRegex(val);
      return { ...prev, [field]: exploded };
    });
  };

  const groupExtensions = (field: 'inc_ext' | 'exc_ext') => {
    logInfo('[FiltersSection] groupExtensions handler triggered', field);
    onChangeConfig((prev) => {
      const val = String(prev[field] || '');
      const result = groupExtensionsText(val, FILE_EXT_CATEGORY_GROUPS);
      return { ...prev, [field]: result.text };
    });
  };

  const clearField = (field: keyof ExportConfig) => {
    logInfo('[FiltersSection] clearField handler triggered', field);
    onChangeConfig((prev) => ({ ...prev, [field]: '' }));
  };

  const appendExtensionCategory = (field: 'inc_ext' | 'exc_ext', label: string, extensions: string[]) => {
    logInfo('[FiltersSection] appendExtensionCategory handler triggered', { field, label, extensions });
    onChangeConfig((prev) => {
      const current = prev[field] ? prev[field].split('\n') : [];
      const combined = Array.from(new Set([...current, ...extensions]));
      return { ...prev, [field]: combined.join('\n') };
    });
  };

  return (
    <CollapsibleCard
      id="block-filters"
      title="🔍 Filters & Scope Constraints"
      tooltip="Regular Expression masks defining targeted directories and source formatting inclusions or exclusions lists."
      summaryBadges={summaryBadges}
      defaultOpen={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0"
    >
      <div className="space-y-3 w-full min-w-0 font-mono text-xs">
        {/* Top Constraint Controls */}
        <div className="flex items-center gap-2 w-full min-w-0">
          <label className="font-semibold text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            🏋️ Max File
          </label>
          <Input
            value={config.max_file}
            onChange={(e) =>
              onChangeConfig((prev) => ({ ...prev, max_file: e.target.value }))
            }
            className="bg-background w-24 h-7 font-mono text-xs shrink-0"
          /> KB
        </div>

        {/* Outer Grid: Grouped Inclusions and Grouped Exclusions */}
        <div className="gap-3 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] w-full min-w-0">
          {/* Grouped Inclusions */}
          <div className="space-y-2 bg-muted/20 p-2.5 border border-border/40 rounded-md w-full min-w-0">
            <div className="flex justify-between items-center min-w-0 font-semibold text-[11px] text-foreground">
              <span className="truncate">✅ Inclusions</span>
            </div>

            {/* Inner Grid: Include Paths & Include Exts */}
            <div className="gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full min-w-0">
              {/* Include Paths */}
              <div className="space-y-1 w-full min-w-0">
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px] text-muted-foreground">
                  <span className="truncate">Paths</span>
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => toggleSortLines('inc_paths')}
                      data-tooltip={`Sort lines (${sortDirections.inc_paths === 'asc' ? 'Ascending' : 'Descending'})`}
                    >
                      {sortDirections.inc_paths === 'asc' ? <ArrowDownAZ size={11} /> : <ArrowUpAZ size={11} />}
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => explodeRegex('inc_paths')}
                      data-tooltip="Explode regex alternatives"
                    >
                      <UnfoldVertical size={11} />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => clearField('inc_paths')}
                      data-tooltip="Clear field"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={config.inc_paths}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({ ...prev, inc_paths: e.target.value }))
                  }
                  rows={3}
                  className="bg-background w-full min-w-0 font-mono text-xs resize-y"
                />
              </div>

              {/* Include Extensions */}
              <div className="space-y-1 w-full min-w-0">
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px] text-muted-foreground">
                  <span className="truncate">Extensions</span>
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => toggleSortLines('inc_ext')}
                      data-tooltip={`Sort lines (${sortDirections.inc_ext === 'asc' ? 'Ascending' : 'Descending'})`}
                    >
                      {sortDirections.inc_ext === 'asc' ? <ArrowDownAZ size={11} /> : <ArrowUpAZ size={11} />}
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => groupExtensions('inc_ext')}
                      data-tooltip="Group extensions by category"
                    >
                      <Library size={11} />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => explodeRegex('inc_ext')}
                      data-tooltip="Explode regex alternatives"
                    >
                      <UnfoldVertical size={11} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost" data-tooltip="Category Presets">
                          <MoreVertical size={11} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {FILE_EXT_CATEGORY_GROUPS.filter((g) => g.includeExtsMenuEnabled).map(
                          (grp) => (
                            <DropdownMenuItem
                              key={grp.label}
                              onClick={() => appendExtensionCategory('inc_ext', grp.label, grp.extensions)}
                            >
                              {grp.label}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => clearField('inc_ext')}
                      data-tooltip="Clear field"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={config.inc_ext}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({ ...prev, inc_ext: e.target.value }))
                  }
                  rows={3}
                  className="bg-background w-full min-w-0 font-mono text-xs resize-y"
                />
              </div>
            </div>
          </div>

          {/* Grouped Exclusions */}
          <div className="space-y-2 bg-muted/20 p-2.5 border border-border/40 rounded-md w-full min-w-0">
            <div className="flex justify-between items-center min-w-0 font-semibold text-[11px] text-foreground">
              <span className="truncate">🚫 Exclusions</span>
            </div>

            {/* Inner Grid: Exclude Paths & Exclude Exts */}
            <div className="gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full min-w-0">
              {/* Exclude Paths */}
              <div className="space-y-1 w-full min-w-0">
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px] text-muted-foreground">
                  <span className="truncate">Paths</span>
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => toggleSortLines('exc_paths')}
                      data-tooltip={`Sort lines (${sortDirections.exc_paths === 'asc' ? 'Ascending' : 'Descending'})`}
                    >
                      {sortDirections.exc_paths === 'asc' ? <ArrowDownAZ size={11} /> : <ArrowUpAZ size={11} />}
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => explodeRegex('exc_paths')}
                      data-tooltip="Explode regex alternatives"
                    >
                      <UnfoldVertical size={11} />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => clearField('exc_paths')}
                      data-tooltip="Clear field"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={config.exc_paths}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({ ...prev, exc_paths: e.target.value }))
                  }
                  rows={3}
                  className="bg-background w-full min-w-0 font-mono text-xs resize-y"
                />
              </div>

              {/* Exclude Extensions */}
              <div className="space-y-1 w-full min-w-0">
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px] text-muted-foreground">
                  <span className="truncate">Extensions</span>
                  <div className="flex gap-0.5 shrink-0">
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => toggleSortLines('exc_ext')}
                      data-tooltip={`Sort lines (${sortDirections.exc_ext === 'asc' ? 'Ascending' : 'Descending'})`}
                    >
                      {sortDirections.exc_ext === 'asc' ? <ArrowDownAZ size={11} /> : <ArrowUpAZ size={11} />}
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => groupExtensions('exc_ext')}
                      data-tooltip="Group extensions by category"
                    >
                      <Library size={11} />
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => explodeRegex('exc_ext')}
                      data-tooltip="Explode regex alternatives"
                    >
                      <UnfoldVertical size={11} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost" data-tooltip="Category Presets">
                          <MoreVertical size={11} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {FILE_EXT_CATEGORY_GROUPS.filter((g) => g.excludeExtsMenuEnabled).map(
                          (grp) => (
                            <DropdownMenuItem
                              key={grp.label}
                              onClick={() => appendExtensionCategory('exc_ext', grp.label, grp.extensions)}
                            >
                              {grp.label}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      onClick={() => clearField('exc_ext')}
                      data-tooltip="Clear field"
                    >
                      <Trash2 size={11} />
                    </Button>
                  </div>
                </div>
                <Textarea
                  value={config.exc_ext}
                  onChange={(e) =>
                    onChangeConfig((prev) => ({ ...prev, exc_ext: e.target.value }))
                  }
                  rows={3}
                  className="bg-background w-full min-w-0 font-mono text-xs resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Filter Simulator */}
        <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 bg-muted/30 p-2 border border-border rounded-md w-full min-w-0">
          <span className="font-bold text-[11px] text-foreground truncate shrink-0">
            🧪 Filters Simulator:
          </span>
          <Input
            value={filterSimulatorInput}
            onChange={(e) => setFilterSimulatorInput(e.target.value)}
            placeholder="Enter test file path or name to simulate matching rules..."
            className="flex-1 bg-background min-w-0 h-7 font-mono text-xs"
          />
          <div className="flex justify-end items-center gap-1.5 min-w-0 shrink-0">
            <span className="px-1 text-base shrink-0" data-tooltip={simResult.reason}>
              {!filterSimulatorInput.trim()
                ? '❓'
                : simResult.isMatched
                ? '✅'
                : '🚫'}
            </span>
            <span className="max-w-[140px] sm:max-w-[200px] font-mono text-[10px] text-muted-foreground truncate" data-tooltip={simResult.reason}>
              {filterSimulatorInput.trim() ? simResult.reason : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default FiltersSection;
EOF

# Update ActionToolbar.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/ActionToolbar.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Play, Square, ExternalLink } from 'lucide-react';
import { ExportExchangeLink } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '../utils/log-info';

interface ActionToolbarProps {
  isRunning: boolean;
  onRunExport: () => void;
  onKillExport: () => void;
  onOpenExchangeUrl: (url: string) => void;
  exchangeLinks?: ExportExchangeLink[];
}

export const ActionToolbar: React.FC<ActionToolbarProps> = ({
  isRunning,
  onRunExport,
  onKillExport,
  onOpenExchangeUrl,
  exchangeLinks = [],
}) => {
  const handleRun = () => {
    logInfo('[ActionToolbar] onRunExport handler triggered');
    onRunExport();
  };

  const handleKill = () => {
    logInfo('[ActionToolbar] onKillExport handler triggered');
    onKillExport();
  };

  const handleExchange = (url: string) => {
    logInfo('[ActionToolbar] onOpenExchangeUrl handler triggered', url);
    onOpenExchangeUrl(url);
  };

  return (
    <div className="p-3 bg-card flex flex-wrap items-center justify-center gap-3 border-b border-border font-mono text-xs">
      {isRunning ? (
        <Button
          variant="destructive"
          onClick={handleKill}
          className="h-9 px-6 font-bold gap-2 cursor-pointer"
        >
          <Square size={14} className="fill-current" />
          STOP EXPORT
        </Button>
      ) : (
        <Button
          onClick={handleRun}
          className="h-9 px-8 font-bold gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white cursor-pointer shadow-md"
        >
          <Play size={14} className="fill-current" />
          RUN EXPORT
        </Button>
      )}

      <div className="flex items-center gap-2 border-l border-border pl-3">
        {exchangeLinks && exchangeLinks.length > 0 ? (
          exchangeLinks.map((link, idx) => (
            <Button
              key={idx}
              size="sm"
              variant="outline"
              onClick={() => handleExchange(link.url)}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
              data-tooltip={link.tooltip}
            >
              {link.icon ? (
                <img src={link.icon} alt={link.tooltip} className="w-4 h-4 object-contain" />
              ) : (
                <ExternalLink size={12} />
              )}
              {link.tooltip || 'Exchange'}
            </Button>
          ))
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExchange('https://gemini.google.com/')}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              Gemini
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExchange('https://notebooklm.google.com/')}
              className="h-8 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <ExternalLink size={12} />
              NotebookLM
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
EOF

# Update FilesTab.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/tabs/FilesTab.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FileCode, FolderOpen } from 'lucide-react';
import { ExportReportData } from '@/shared/services/file-exporter/model/file-exporter-model';
import { logInfo } from '../../utils/log-info';

interface FilesTabProps {
  reportData: ExportReportData | null;
  destDir: string;
  onOpenFile: (filePath: string) => void;
  onRevealFile: (filePath: string) => void;
}

export const FilesTab: React.FC<FilesTabProps> = ({
  reportData,
  destDir,
  onOpenFile,
  onRevealFile,
}) => {
  const [fileNameFilter, setFileNameFilter] = useState('');
  const [fileContentFilter, setFileContentFilter] = useState('');

  const exports = reportData?.generated_files?.exports || [];

  const filteredExports = exports.filter((file) => {
    const name = file.split(/[\\/]/).pop() || '';
    if (fileNameFilter && !new RegExp(fileNameFilter, 'i').test(name)) {
      return false;
    }
    return true;
  });

  const handleOpenFile = (filePath: string) => {
    logInfo('[FilesTab] handleOpenFile handler triggered', filePath);
    onOpenFile(filePath);
  };

  const handleRevealFile = (filePath: string) => {
    logInfo('[FilesTab] handleRevealFile handler triggered', filePath);
    onRevealFile(filePath);
  };

  return (
    <div className="space-y-3 bg-background p-4 font-mono text-xs">
      <div className="gap-2 grid grid-cols-1 md:grid-cols-2">
        <Input
          value={fileNameFilter}
          onChange={(e) => {
            logInfo('[FilesTab] fileNameFilter changed', e.target.value);
            setFileNameFilter(e.target.value);
          }}
          placeholder="Filter by file name regex..."
          className="bg-card h-7 font-mono text-xs"
        />
        <Input
          value={fileContentFilter}
          onChange={(e) => {
            logInfo('[FilesTab] fileContentFilter changed', e.target.value);
            setFileContentFilter(e.target.value);
          }}
          placeholder="Filter by content regex..."
          className="bg-card h-7 font-mono text-xs"
        />
      </div>

      <div className="space-y-1 bg-card p-2 border border-border rounded max-h-[350px] overflow-y-auto">
        <div className="pb-1 border-border border-b font-bold text-[11px] text-foreground">
          📂 Exported Files ({filteredExports.length})
        </div>

        {filteredExports.length === 0 ? (
          <div className="py-4 text-muted-foreground text-center italic">
            No exported files generated.
          </div>
        ) : (
          filteredExports.map((filePath) => {
            const fileName = filePath.split(/[\\/]/).pop() || '';
            return (
              <div
                key={filePath}
                className="flex justify-between items-center hover:bg-muted/40 p-1 border-border/40 border-b rounded"
              >
                <div
                  onClick={() => handleOpenFile(filePath)}
                  className="flex flex-1 items-center gap-1.5 text-primary hover:underline truncate cursor-pointer"
                >
                  <FileCode size={13} className="shrink-0" />
                  <span className="truncate">{fileName}</span>
                </div>

                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => handleRevealFile(filePath)}
                  data-tooltip="Reveal in OS Explorer"
                >
                  <FolderOpen size={12} />
                </Button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
EOF

# Update HelpTab.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/tabs/HelpTab.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { logInfo } from '../../utils/log-info';

export const HelpTab: React.FC = () => {
  const samplePrompt = `Role: Senior Software Architect
Context: Analyze the provided codebase export attachment.
Task: Identify modular refactoring candidates and security improvements.`;

  const handleCopyPrompt = () => {
    logInfo('[HelpTab] handleCopyPrompt handler triggered');
    vsCodeApiService.copyToClipboard(samplePrompt);
  };

  return (
    <div className="p-4 space-y-4 font-mono text-xs bg-background text-foreground leading-relaxed">
      <div className="p-3 bg-primary/10 border border-primary/20 rounded font-bold text-primary">
        📖 Codebase Exporter Quick User Guide
      </div>

      <div className="space-y-2">
        <h4 className="font-bold text-primary text-xs">🚀 Workflows & Tips</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground text-[11px]">
          <li>Specify multi-line paths in <strong>Source Paths</strong> or use Git Diff auto-discovery.</li>
          <li>Configure regex inclusions & exclusions for files, folders, and extensions.</li>
          <li>Use the <strong>Filters Simulator</strong> to test regex matching in real-time.</li>
          <li>Select output formats (YAML, JSON, XML, TOML, TXT) optimized for LLM contexts.</li>
        </ul>
      </div>

      <div className="space-y-2 p-3 bg-card border border-border rounded">
        <div className="flex justify-between items-center">
          <h4 className="font-bold text-foreground text-xs">💡 Sample LLM Prompt Template</h4>
          <Button size="icon-xs" variant="outline" onClick={handleCopyPrompt} data-tooltip="Copy Prompt">
            <Copy size={12} />
          </Button>
        </div>
        <pre className="p-2 bg-muted text-foreground rounded text-[10px] overflow-x-auto">
          {samplePrompt}
        </pre>
      </div>
    </div>
  );
};
EOF

# Update TreeTab.tsx: Replace native title with data-tooltip
cat << 'EOF' > webview/src/features/exporter/components/tabs/TreeTab.tsx
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Folder, FileCode, ChevronRight, ChevronDown, FolderOpen, Ban, Search, X } from 'lucide-react';
import { TreeManifestNode } from '@/shared/services/file-exporter/model/file-exporter-model';
import { filesExporterApiService } from '@/services/api/files-exporter-api.service.gen';
import { logInfo } from '../../utils/log-info';

export interface TreeTabProps {
  rootNode: TreeManifestNode | null;
  onExcludePattern: (pattern: string, isExt: boolean) => void;
  onCaptureSelectedPaths: (paths: string[]) => void;
}

export function TreeTab({ rootNode, onExcludePattern, onCaptureSelectedPaths }: TreeTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'extension'>('standard');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>({});

  const toggleExpand = (pathKey: string) => {
    logInfo('[TreeTab] toggleExpand handler triggered', pathKey);
    setExpandedKeys((prev) => ({ ...prev, [pathKey]: !prev[pathKey] }));
  };

  const toggleCheck = (pathKey: string, node: TreeManifestNode) => {
    logInfo('[TreeTab] toggleCheck handler triggered', pathKey);
    const isChecked = !checkedKeys[pathKey];
    const newChecked = { ...checkedKeys };

    const updateChildChecks = (n: TreeManifestNode) => {
      newChecked[n.absolute_path] = isChecked;
      if (n.children) {
        Object.values(n.children).forEach(updateChildChecks);
      }
    };

    updateChildChecks(node);
    setCheckedKeys(newChecked);
  };

  const handleOpenFile = (path: string) => {
    logInfo('[TreeTab] handleOpenFile handler triggered', path);
    filesExporterApiService.openPathAtCursor(path);
  };

  const handleRevealNode = (path: string) => {
    logInfo('[TreeTab] handleRevealNode handler triggered', path);
    filesExporterApiService.openPathAtCursor(path);
  };

  const handleExcludePattern = (pattern: string, isExt: boolean) => {
    logInfo('[TreeTab] handleExcludePattern handler triggered', { pattern, isExt });
    onExcludePattern(pattern, isExt);
  };

  const handleToggleViewMode = () => {
    const nextMode = viewMode === 'standard' ? 'extension' : 'standard';
    logInfo('[TreeTab] handleToggleViewMode handler triggered', nextMode);
    setViewMode(nextMode);
  };

  const handleCaptureSelected = () => {
    logInfo('[TreeTab] handleCaptureSelected handler triggered');
    const selected = Object.entries(checkedKeys)
      .filter(([_, v]) => v)
      .map(([k]) => k);
    onCaptureSelectedPaths(selected);
  };

  const renderNode = (node: TreeManifestNode, depth: number = 0): React.ReactNode => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedKeys[node.absolute_path] ?? depth === 0;
    const isChecked = checkedKeys[node.absolute_path] ?? false;

    if (searchQuery.trim()) {
      const name = node.name || '';
      const matches = useRegex
        ? new RegExp(searchQuery, 'i').test(name)
        : name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matches && !isDir) return null;
    }

    return (
      <div key={node.absolute_path} className="font-mono text-xs select-none">
        <div
          className="flex items-center gap-1.5 hover:bg-muted/40 px-2 py-0.5 rounded transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isDir ? (
            <button onClick={() => toggleExpand(node.absolute_path)} className="text-muted-foreground p-0 h-4 w-4">
              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : (
            <div className="w-4" />
          )}

          <Checkbox
            checked={isChecked}
            onCheckedChange={() => toggleCheck(node.absolute_path, node)}
          />

          {isDir ? <Folder size={13} className="text-indigo-400 shrink-0" /> : <FileCode size={13} className="text-emerald-500 shrink-0" />}

          <span
            className={`truncate ${!isDir ? 'hover:underline cursor-pointer text-primary' : 'font-medium'}`}
            onClick={() => !isDir && handleOpenFile(node.absolute_path)}
          >
            {node.name}
          </span>

          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => handleRevealNode(node.absolute_path)}
              data-tooltip="Reveal in Explorer"
            >
              <FolderOpen size={11} />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                const rel = node.name;
                handleExcludePattern(isDir ? `.*/${rel}/.*` : `.*/${rel}$`, false);
              }}
              data-tooltip="Exclude Pattern"
            >
              <Ban size={11} className="text-destructive" />
            </Button>
          </div>
        </div>

        {isDir && isExpanded && node.children && (
          <div>{Object.values(node.children).map((child) => renderNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  if (!rootNode) {
    return (
      <div className="p-8 text-center text-muted-foreground font-mono text-xs italic">
        No tree manifest generated. Enable Tree View setting and run export.
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-background p-4 font-mono text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-card p-2 border border-border rounded">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              logInfo('[TreeTab] searchQuery changed', e.target.value);
              setSearchQuery(e.target.value);
            }}
            placeholder="Search manifest nodes..."
            className="h-7 text-xs font-mono bg-background"
          />
          {searchQuery && (
            <Button size="icon-xs" variant="ghost" onClick={() => {
              logInfo('[TreeTab] searchQuery cleared');
              setSearchQuery('');
            }}>
              <X size={12} />
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleToggleViewMode}
            className="h-7 text-[10px] font-mono"
          >
            Mode: {viewMode.toUpperCase()}
          </Button>
          <Button
            size="sm"
            onClick={handleCaptureSelected}
            className="h-7 text-[10px] font-mono"
          >
            Capture Selected
          </Button>
        </div>
      </div>

      <div className="p-2 bg-card border border-border rounded max-h-[450px] overflow-y-auto space-y-0.5">
        {renderNode(rootNode)}
      </div>
    </div>
  );
}
EOF

echo "✅ refactor: Replaced native HTML title attributes with data-tooltip across all exporter components"

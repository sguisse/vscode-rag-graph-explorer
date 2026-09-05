#!/usr/bin/env bash
set -e

# Create necessary directories
mkdir -p webview/src/features/exporter/components

# 1. Update SourcePathsSection.tsx to show destructive red badge when in error state or empty
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
  const validationState = useExporterStore((s) => s.validationState);

  const srcError = validationState.errors?.src;
  const isInvalid = validationState.pathListInvalid || Boolean(srcError);

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

    const isInvalidPath = invalidPaths.some(
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
    if (isInvalidPath) {
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

  if (lines.length === 0 && isInvalid) {
    summaryBadges.push({
      label: '⚠️ Source path required',
      tooltip: srcError || 'At least one source path is required.',
      className: 'bg-destructive/10 text-destructive border-destructive/30 font-semibold',
    });
  }

  const totalPathsBadge = (
    <span
      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none border ${
        isInvalid
          ? 'bg-destructive/10 text-destructive border-destructive/30'
          : 'bg-primary/10 text-primary border-primary/20'
      }`}
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
          className={`flex-1 h-[138px] font-mono text-xs resize-y ${
            isInvalid
              ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
              : 'bg-background'
          }`}
          data-tooltip={srcError ? `⚠️ Error: ${srcError}` : undefined}
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

# 2. Update DestinationSection.tsx to style summary badges with destructive red when in error state
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
  const validationState = useExporterStore((s) => s.validationState);
  const [destExists, setDestExists] = useState<boolean>(true);

  const destError = validationState.errors?.dest;
  const isInvalid = validationState.destDirInvalid || Boolean(destError);

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
        const isInvalidPath = Boolean(invalid && invalid.length > 0);
        setDestExists(!isInvalidPath);
      })
      .catch(() => {
        setDestExists(true);
      });
  }, [absDest, workspaceRoot]);

  const normDest = absDest.replace(/\\/g, '/');
  const normWs = workspaceRoot ? workspaceRoot.replace(/\\/g, '/').replace(/\/+$/, '') : '';
  const isExternal = Boolean(normWs && !normDest.startsWith(normWs));

  let tooltip = formattedDest;
  if (destError) {
    tooltip = `⚠️ Error: ${destError}`;
  } else if (!destExists) {
    tooltip = `⚠️ Warning because you have defined an non existing folder. <br> It will be created automatically`;
  } else if (isExternal) {
    tooltip = `⚠️ Warning: You reference a destination directory outside the current workspace: ${absDest}`;
  }

  const isWarning = !destExists || isExternal;

  let badgeClassName = 'bg-primary/10 text-primary border-primary/20 [direction:rtl] text-left w-full min-w-0 truncate';
  if (isInvalid) {
    badgeClassName = 'bg-destructive/10 text-destructive border-destructive/30 font-semibold [direction:rtl] text-left w-full min-w-0 truncate';
  } else if (isWarning) {
    badgeClassName = 'bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold [direction:rtl] text-left w-full min-w-0 truncate';
  }

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
          className={`h-7 text-xs font-mono flex-1 ${
            isInvalid
              ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
              : 'bg-background'
          }`}
          data-tooltip={destError ? `⚠️ Error: ${destError}` : undefined}
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

# 3. Update FiltersSection.tsx to style summary badges with destructive red when in error state
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
import { useExporterStore } from '../store/useExporterStore';
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

  const validationState = useExporterStore((s) => s.validationState);
  const maxFileErr = validationState.errors?.max_file;
  const incPathsErr = validationState.errors?.inc_paths;
  const excPathsErr = validationState.errors?.exc_paths;
  const incExtErr = validationState.errors?.inc_ext;
  const excExtErr = validationState.errors?.exc_ext;

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
      tooltip: maxFileErr ? `⚠️ Error: ${maxFileErr}` : `Max file size limit: ${config.max_file} KB`,
      className: maxFileErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 font-semibold shrink-0'
        : 'bg-primary/10 text-primary border-primary/20 shrink-0 font-bold',
    },
  ];

  if (incPathCombined || incPathsErr) {
    summaryBadges.push({
      label: `Inc Path: ${incPathCombined || 'Invalid Regex'}`,
      tooltip: incPathsErr ? `⚠️ Error: ${incPathsErr}` : `<strong>Inc Path:</strong> <br> ${incPathTooltip}`,
      className: incPathsErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }
  if (incExtCombined || incExtErr) {
    summaryBadges.push({
      label: `Inc Ext: ${incExtCombined || 'Invalid Regex'}`,
      tooltip: incExtErr ? `⚠️ Error: ${incExtErr}` : `<strong>Inc Ext:</strong> <br> ${incExtTooltip}`,
      className: incExtErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }
  if (excPathCombined || excPathsErr) {
    summaryBadges.push({
      label: `Exc Path: ${excPathCombined || 'Invalid Regex'}`,
      tooltip: excPathsErr ? `⚠️ Error: ${excPathsErr}` : `<strong>Exc Path:</strong> <br> ${excPathTooltip}`,
      className: excPathsErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
    });
  }
  if (excExtCombined || excExtErr) {
    summaryBadges.push({
      label: `Exc Ext: ${excExtCombined || 'Invalid Regex'}`,
      tooltip: excExtErr ? `⚠️ Error: ${excExtErr}` : `<strong>Exc Ext:</strong> <br> ${excExtTooltip}`,
      className: excExtErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : 'bg-primary/10 text-primary border-primary/20 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink',
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
            className={`w-24 h-7 font-mono text-xs shrink-0 ${
              validationState.maxFileInvalid || maxFileErr
                ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                : 'bg-background'
            }`}
            data-tooltip={maxFileErr ? `⚠️ Error: ${maxFileErr}` : undefined}
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
                  className={`w-full min-w-0 font-mono text-xs resize-y ${
                    incPathsErr
                      ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                      : 'bg-background'
                  }`}
                  data-tooltip={incPathsErr ? `⚠️ Error: ${incPathsErr}` : undefined}
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
                  className={`w-full min-w-0 font-mono text-xs resize-y ${
                    incExtErr
                      ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                      : 'bg-background'
                  }`}
                  data-tooltip={incExtErr ? `⚠️ Error: ${incExtErr}` : undefined}
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
                  className={`w-full min-w-0 font-mono text-xs resize-y ${
                    excPathsErr
                      ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                      : 'bg-background'
                  }`}
                  data-tooltip={excPathsErr ? `⚠️ Error: ${excPathsErr}` : undefined}
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
                  className={`w-full min-w-0 font-mono text-xs resize-y ${
                    excExtErr
                      ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                      : 'bg-background'
                  }`}
                  data-tooltip={excExtErr ? `⚠️ Error: ${excExtErr}` : undefined}
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

# 4. Update OutputFormattingSection.tsx to style summary badges with destructive red when in error state
cat << 'EOF' > webview/src/features/exporter/components/OutputFormattingSection.tsx
import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { EXPORT_FORMAT_ICON_MAP, EXPORT_FORMAT_LIST, ExportFormat } from '@/shared/services/codebase-exporter/types/type-export-format.gen';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';
import { useExporterStore } from '../store/useExporterStore';
import { logInfo } from '../utils/log-info';

interface OutputFormattingSectionProps {
  config: ExportConfig;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChangeConfig: (updater: (prev: ExportConfig) => ExportConfig) => void;
}

export const OutputFormattingSection: React.FC<OutputFormattingSectionProps> = ({
  config,
  isOpen,
  onOpenChange,
  onChangeConfig,
}) => {
  const validationState = useExporterStore((s) => s.validationState);
  const maxChunkErr = validationState.errors?.max_chunk;

  const activeCheckboxes: string[] = [];
  if (config.groupByExt) activeCheckboxes.push('Split by Ext');
  if (config.copyGeneratedFilesToClipboard) activeCheckboxes.push('Copy to Clip');
  if (config.generateTreeView) activeCheckboxes.push('Tree View');
  if (config.logConsole) activeCheckboxes.push('Log Console');
  if (config.logFile) activeCheckboxes.push('Log File');

  const summaryBadges: BadgeObject[] = [
    { label: `Format: ${config.format.toUpperCase()}`, tooltip: `Output Format: ${config.format.toUpperCase()}` },
    {
      label: `Chunk: ${config.max_chunk} KB`,
      tooltip: maxChunkErr ? `⚠️ Error: ${maxChunkErr}` : `Max Chunk Size: ${config.max_chunk} KB`,
      className: maxChunkErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 font-semibold'
        : 'bg-primary/10 text-primary border-primary/20',
    },
    ...activeCheckboxes.map((chk) => ({ label: chk, tooltip: `Rule enabled: ${chk}` })),
  ];

  return (
    <CollapsibleCard
      id="block-options"
      title="⚙️ Output Formatting & Rules"
      tooltip="Aggregated output payload formats schemas, text partitions thresholds, chunk splits and logging rules."
      summaryBadges={summaryBadges}
      defaultOpen={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0"
    >
      <div className="flex flex-col space-y-3 w-full min-w-0 font-mono text-xs">
        {/* Format & Chunk Controls */}
        <div className="gap-2.5 grid grid-cols-1 sm:grid-cols-2 w-full min-w-0">
          <div className="space-y-1 w-full min-w-0">
            <label className="block font-semibold text-[10px] text-muted-foreground truncate">
              Output Format
            </label>
            <SelectFromTypeBuilder
              id="select-export-format"
              value={config.format}
              onChange={(val) => {
                if (val) {
                  logInfo('[OutputFormattingSection] Format changed', val);
                  onChangeConfig((prev) => ({ ...prev, format: val as ExportFormat }));
                }
              }}
              triggerClassName="!h-7 min-h-0 py-0 px-2 text-xs border-border rounded-md font-mono w-24"
              options={EXPORT_FORMAT_LIST.map((key) => ({
                value: key,
                icon: EXPORT_FORMAT_ICON_MAP[key]?.icon,
                label: EXPORT_FORMAT_ICON_MAP[key]?.label,
              }))}
            />
          </div>

          <div className="space-y-1 w-full min-w-0">
            <label className="block font-semibold text-[10px] text-muted-foreground truncate">
              Max Chunk (KB)
            </label>
            <Input
              value={config.max_chunk}
              onChange={(e) => {
                logInfo('[OutputFormattingSection] Max chunk changed', e.target.value);
                onChangeConfig((prev) => ({ ...prev, max_chunk: e.target.value }));
              }}
              className={`w-full h-7 font-mono text-xs ${
                validationState.maxChunkInvalid || maxChunkErr
                  ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                  : 'bg-background'
              }`}
              data-tooltip={maxChunkErr ? `⚠️ Error: ${maxChunkErr}` : undefined}
            />
          </div>
        </div>

        {/* Responsive Checkbox Grid with Uniform Equal Width Items */}
        <div className="gap-2 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] pt-2 border-border/40 border-t w-full min-w-0">
          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-split-ext"
              checked={config.groupByExt}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] groupByExt changed', Boolean(val));
                onChangeConfig((prev) => ({ ...prev, groupByExt: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-split-ext" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Split by Ext
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-copy-clip"
              checked={config.copyGeneratedFilesToClipboard}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] copyGeneratedFilesToClipboard changed', Boolean(val));
                onChangeConfig((prev) => ({
                  ...prev,
                  copyGeneratedFilesToClipboard: Boolean(val),
                }));
              }}
            />
            <label htmlFor="cb-copy-clip" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Copy to Clip
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-tree-view"
              checked={config.generateTreeView}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] generateTreeView changed', Boolean(val));
                onChangeConfig((prev) => ({ ...prev, generateTreeView: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-tree-view" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Tree View
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-log-console"
              checked={config.logConsole}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] logConsole changed', Boolean(val));
                onChangeConfig((prev) => ({ ...prev, logConsole: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-log-console" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Log Console
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-log-file"
              checked={config.logFile}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] logFile changed', Boolean(val));
                onChangeConfig((prev) => ({ ...prev, logFile: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-log-file" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Log File
            </label>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default OutputFormattingSection;
EOF

echo "✅ style: Updated collapsible card summary badges to render with destructive red styling when fields contain errors!"
echo "💡 Next step: Run 'cd webview && npm run build' to verify compilation."

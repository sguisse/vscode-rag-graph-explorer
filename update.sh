#!/usr/bin/env bash
set -e

# Variable declaration for safe backtick handling
BTICK=$(printf '\x60')
TRIPLE_TICK=$(printf '\x60\x60\x60')

echo "🚀 Wiring single-click (reveal in Explorer) and double-click (open file in VS Code) for path badges..."

mkdir -p webview/src/components/ui
mkdir -p webview/src/features/exporter/components

# 1. Update CollapsibleCard.tsx to support onClick and onDoubleClick event handlers on BadgeObject
cat << 'EOF' > webview/src/components/ui/collapsible-card.tsx
import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BadgeObject {
  label: React.ReactNode;
  tooltip?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: (e: React.MouseEvent) => void;
}

export interface CollapsibleCardProps {
  id?: string;
  title: React.ReactNode;
  tooltip?: string;
  summaryText?: string;
  summaryBadges?: (string | BadgeObject)[];
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  id,
  title,
  tooltip,
  summaryText,
  summaryBadges,
  defaultOpen = true,
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
  children,
  headerRight,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  const isControlled = controlledIsOpen !== undefined;
  const open = isControlled ? controlledIsOpen : internalIsOpen;

  const handleToggle = () => {
    const nextOpen = !open;
    if (!isControlled) {
      setInternalIsOpen(nextOpen);
    }
    if (onOpenChange) {
      onOpenChange(nextOpen);
    }
  };

  const rawBadges =
    summaryBadges ||
    (summaryText
      ? summaryText
          .split('|')
          .map((s) => s.trim())
          .filter(Boolean)
      : []);

  const badgeItems: BadgeObject[] = rawBadges.map((item) =>
    typeof item === 'string' ? { label: item, tooltip: item } : item
  );

  return (
    <div
      id={id}
      className={cn(
        'bg-card border border-border/60 rounded-md w-full min-w-0 transition-all duration-150',
        className
      )}
    >
      {/* Card Header */}
      <div
        onClick={handleToggle}
        title={tooltip}
        className={cn(
          'flex flex-col border-border/40 cursor-pointer select-none font-mono text-xs',
          open ? 'py-1 px-2 border-b' : 'p-1'
        )}
      >
        <div className="flex items-center justify-between gap-2 w-full min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 shrink-0">
            <span className="text-primary shrink-0">
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </span>
            <span className="font-bold text-foreground text-xs shrink-0">{title}</span>
          </div>

          {headerRight && (
            <div className="shrink-0 flex items-center gap-1 ml-auto" onClick={(e) => e.stopPropagation()}>
              {headerRight}
            </div>
          )}
        </div>

        {/* Collapsed Mode: Badges on a new line aligned to the left */}
        {!open && badgeItems.length > 0 && (
          <div className="flex flex-wrap items-center justify-start gap-1.5 w-full min-w-0 mt-1 pt-0.5">
            {badgeItems.map((badge, idx) => (
              <span
                key={idx}
                onClick={(e) => {
                  if (badge.onClick) {
                    e.stopPropagation();
                    badge.onClick(e);
                  }
                }}
                onDoubleClick={(e) => {
                  if (badge.onDoubleClick) {
                    e.stopPropagation();
                    badge.onDoubleClick(e);
                  }
                }}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[10px] font-mono leading-none shadow-2xs min-w-0 truncate shrink border cursor-pointer hover:opacity-85 active:scale-[0.98] transition-all',
                  badge.className || 'bg-primary/10 text-primary border-primary/20'
                )}
                title={badge.tooltip || (typeof badge.label === 'string' ? badge.label : undefined)}
                data-tooltip={badge.tooltip || (typeof badge.label === 'string' ? badge.label : undefined)}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Card Content */}
      {open && <div className="p-2 w-full min-w-0">{children}</div>}
    </div>
  );
};

export default CollapsibleCard;
EOF

# 2. Update SourcePathsSection.tsx to attach revealInExplorer on click and openFile on double-click
cat << 'EOF' > webview/src/features/exporter/components/SourcePathsSection.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileCode, GitCompare, Bug, ExternalLink, Trash2, X } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { useExporterStore } from '../store/useExporterStore';
import { PathMappingService } from '../utils/path-resolver';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
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
      logInfo('[SourcePathsSection] Single click on badge -> revealInExplorer', absPath);
      vsCodeApiService.revealInExplorer(absPath);
    };

    const onDoubleClick = () => {
      if (isFile) {
        logInfo('[SourcePathsSection] Double click on file badge -> openFile', absPath);
        vsCodeApiService.openFile(absPath);
      }
    };

    const actionTooltip = isFile
      ? 'Single-click to reveal in Explorer, Double-click to open file in editor'
      : 'Single-click to reveal folder in Explorer';

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
                title="Remove invalid path from list"
              >
                <X size={11} />
              </button>
            </div>
          ),
          tooltip: `Invalid Path (Does not exist on disk): ${absPath}`,
          className:
            'bg-destructive/10 text-destructive border-destructive/30 font-semibold max-w-[280px] sm:max-w-[360px] min-w-0',
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
          tooltip: `External Path: ${absPath}\n(${actionTooltip})`,
          className:
            'bg-amber-500/10 text-amber-600 border-amber-500/30 font-semibold max-w-[280px] sm:max-w-[360px] min-w-0',
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
          tooltip: `Workspace File: ${absPath}\n(${actionTooltip})`,
          className:
            'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold max-w-[280px] sm:max-w-[360px] min-w-0',
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
        tooltip: `Workspace Folder: ${absPath}\n(${actionTooltip})`,
        className:
          'bg-primary/10 text-primary border-primary/20 font-semibold max-w-[280px] sm:max-w-[360px] min-w-0',
        onClick,
        onDoubleClick,
      },
    ];
  });

  const totalPathsBadge = (
    <span
      className="bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none"
      title={`${lines.length} total ${lines.length === 1 ? 'path' : 'paths'} selected`}
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
            title="Add Currently Open Editor Files"
          >
            <FileCode size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleAddGitDiffFiles}
            title="Add Modified Files from Git Diff"
          >
            <GitCompare size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleAddErrorStackFiles}
            title="Extract References from Crash Stack Trace"
          >
            <Bug size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleOpenCursorLinePath}
            title="Open Target Path at Cursor Line"
          >
            <ExternalLink size={13} />
          </Button>

          <Button
            size="icon-xs"
            variant="outline"
            onClick={handleClearPaths}
            title="Clear Source Paths"
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

echo "✅ feat(exporter): 🔍 path badges single-click now triggers revealInExplorer and double-click opens files in VS Code!"

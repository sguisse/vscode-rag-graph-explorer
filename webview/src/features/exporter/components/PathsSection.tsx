import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileCode, GitCompare, Bug, ExternalLink, Trash2, X } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { useExporterStore } from '../store/useExporterStore';
import { useExporterValidation } from '../hooks/use-exporter-validation';
import { PathMappingService } from '../utils/path-resolver';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { fileExporterApiService } from '@/services/api/file-exporter-api.service.gen';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { FiltersSection, getFilterSummaryBadges } from './FiltersSection';
import { ExportFilter } from '@/shared/services/file-exporter/model/file-exporter-model';

export type ScopeType = 'codebase' | 'reference';

export interface PathsSectionProps {
  scopeType: ScopeType;
  title: string;
  tooltip: string;
  filter: ExportFilter;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  isFiltersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  onChangeFilter: (updater: (prev: ExportFilter) => ExportFilter) => void;
  onChangePathsText: (text: string) => void;
  onAddOpenFiles: () => void;
  onAddGitDiffFiles: () => void;
  onAddErrorStackFiles: () => void;
  onOpenCursorLinePath: () => void;
  onClearPaths: () => void;
  filterSimulatorInput: string;
  setFilterSimulatorInput: (val: string) => void;

  showAddOpenFiles?: boolean;
  showAddGitDiffFiles?: boolean;
  showAddErrorStackFiles?: boolean;
  showOpenCursorLinePath?: boolean;
  showClearPaths?: boolean;
  extraHeaderActions?: React.ReactNode;
}

export const PathsSection: React.FC<PathsSectionProps> = ({
  scopeType,
  title,
  tooltip,
  filter,
  isOpen = true,
  onOpenChange,
  isFiltersOpen,
  onFiltersOpenChange,
  onChangeFilter,
  onChangePathsText,
  onAddOpenFiles,
  onAddGitDiffFiles,
  onAddErrorStackFiles,
  onOpenCursorLinePath,
  onClearPaths,
  filterSimulatorInput = '',
  setFilterSimulatorInput,
  showAddOpenFiles = true,
  showAddGitDiffFiles = true,
  showAddErrorStackFiles = true,
  showOpenCursorLinePath = true,
  showClearPaths = true,
  extraHeaderActions,
}) => {
  const workspaceRoot = useExporterStore((s) => s.workspaceRoot);
  const invalidPaths = useExporterStore((s) => s.invalidPaths);
  const validationState = useExporterStore((s) => s.validationState);
  const { handleBlur } = useExporterValidation();

  const errKey = scopeType === 'codebase' ? 'codebase_src' : 'reference_src';
  const pathError = validationState.errors?.[errKey as keyof typeof validationState.errors];
  const isInvalid = Boolean(pathError);

  const pathsText = filter?.src || '';
  const lines = pathsText.split(/[,\n\r]+/).map((l) => l.trim()).filter(Boolean);

  const handleRemovePath = (lineToRemove: string) => {
    logInfo(`[PathsSection:${scopeType}] handleRemovePath triggered`, [lineToRemove]);
    const newLines = lines.filter((l) => l !== lineToRemove);
    onChangePathsText(newLines.join('\n'));
  };

  const handleFocusFilterField = (fieldKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenChange) onOpenChange(true);
    if (onFiltersOpenChange) onFiltersOpenChange(true);

    setTimeout(() => {
      let targetId = '';
      if (fieldKey === 'max_file') targetId = `input-${scopeType}-max-file`;
      else if (fieldKey === 'inc_paths') targetId = `textarea-${scopeType}-inc-paths`;
      else if (fieldKey === 'inc_ext') targetId = `textarea-${scopeType}-inc-ext`;
      else if (fieldKey === 'exc_paths') targetId = `textarea-${scopeType}-exc-paths`;
      else if (fieldKey === 'exc_ext') targetId = `textarea-${scopeType}-exc-ext`;

      if (targetId) {
        const el = document.getElementById(targetId);
        if (el) {
          el.focus();
          if ('select' in el && typeof (el as any).select === 'function') {
            (el as HTMLInputElement).select();
          }
        }
      }
    }, 100);
  };

  const pathBadges: BadgeObject[] = lines.flatMap((line) => {
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
      logInfo(`[PathsSection:${scopeType}] Single click on badge -> revealInExplorer & copyToClipboard`, [absPath]);
      vsCodeApiService.revealInExplorer(absPath);
      vsCodeApiService.copyToClipboard(absPath);
      fileExporterApiService.showNotification('info', `Path copied to clipboard: ${absPath}`);
    };

    const onDoubleClick = () => {
      if (isFile) {
        logInfo(`[PathsSection:${scopeType}] Double click on file badge -> openFile`, [absPath]);
        vsCodeApiService.openFile(absPath);
      }
    };

    const actionTooltip = isFile
      ? 'Single-click to copy path & reveal in Explorer, Double-click to open file'
      : 'Single-click to copy path & reveal folder in Explorer';

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

    const badgeColor = scopeType === 'codebase'
      ? (isExternal ? 'bg-amber-500/10 text-amber-600 border-amber-500/30' : isFile ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' : 'bg-primary/10 text-primary border-primary/20')
      : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30';

    return [
      {
        label: <span className="[direction:rtl] text-left truncate block min-w-0">{fullDisplay}</span>,
        tooltip: `${scopeType === 'codebase' ? (isFile ? 'Codebase File' : 'Codebase Folder') : 'Reference Path'}: ${absPath}<br/>(${actionTooltip})`,
        className: `${badgeColor} font-semibold max-w-[280px] sm:max-w-[1000px] min-w-0`,
        onClick,
        onDoubleClick,
      },
    ];
  });

  const summaryBadges: BadgeObject[] = [...pathBadges];

  if (!isOpen) {
    const filterBadges = getFilterSummaryBadges(filter, scopeType, validationState, handleFocusFilterField);
    if (filterBadges.length > 0) {
      if (pathBadges.length > 0) {
        summaryBadges.push({
          label: '',
          className: 'basis-full h-0 w-full border-0 p-0 m-0 pointer-events-none opacity-0 invisible',
        });
      }

      filterBadges.forEach((badge) => {
        summaryBadges.push(badge);
      });
    }
  }

  const cardTitle = (
    <div className="flex items-center gap-2">
      <span>{title}</span>
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none border ${
          isInvalid
            ? 'bg-destructive/10 text-destructive border-destructive/30'
            : scopeType === 'codebase'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
        }`}
        data-tooltip={`${lines.length} total ${scopeType} ${lines.length === 1 ? 'path' : 'paths'} selected`}
      >
        {lines.length}
      </span>
    </div>
  );

  const headerRight = (
    <div className="flex items-center gap-1">
      {showAddOpenFiles && (
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAddOpenFiles();
          }}
          data-tooltip="Add Currently Open Editor Files"
          className="h-5 w-5 cursor-pointer hover:bg-accent"
        >
          <FileCode size={12} />
        </Button>
      )}

      {showAddGitDiffFiles && (
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAddGitDiffFiles();
          }}
          data-tooltip="Add Modified Files from Git Diff"
          className="h-5 w-5 cursor-pointer hover:bg-accent"
        >
          <GitCompare size={12} />
        </Button>
      )}

      {showAddErrorStackFiles && (
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onAddErrorStackFiles();
          }}
          data-tooltip="Extract References from Crash Stack Trace"
          className="h-5 w-5 cursor-pointer hover:bg-accent"
        >
          <Bug size={12} />
        </Button>
      )}

      {showOpenCursorLinePath && (
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCursorLinePath();
          }}
          data-tooltip="Open Target Path at Cursor Line"
          className="h-5 w-5 cursor-pointer hover:bg-accent"
        >
          <ExternalLink size={12} />
        </Button>
      )}

      {extraHeaderActions}

      {showClearPaths && (
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation();
            onClearPaths();
          }}
          data-tooltip={`Clear ${scopeType} Paths`}
          className="h-5 w-5 hover:text-destructive cursor-pointer"
        >
          <Trash2 size={12} />
        </Button>
      )}
    </div>
  );

  const handleChangeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const rawVal = e.target.value || '';
    if (rawVal.includes(',')) {
      const splitList = rawVal.split(/[,\n\r]+/).map((s) => s.trim()).filter(Boolean);
      const formattedList = splitList.map((p) => PathMappingService.registerPath(p, workspaceRoot));
      onChangePathsText(Array.from(new Set(formattedList)).join('\n'));
    } else {
      onChangePathsText(rawVal);
    }
  };

  return (
    <div className="space-y-2 w-full min-w-0">
      <CollapsibleCard
        id={`block-${scopeType}-paths`}
        title={cardTitle}
        tooltip={tooltip}
        summaryBadges={summaryBadges}
        headerRight={headerRight}
        defaultOpen={false}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        className="w-full min-w-0 shrink-0"
      >
        <div className="flex items-start gap-2 font-mono text-xs">
          <Textarea
            value={pathsText}
            onChange={handleChangeTextarea}
            onBlur={() => handleBlur(scopeType === 'codebase' ? 'codebase_src' : 'reference_src')}
            placeholder={`Enter ${scopeType} directories, files, or Java package.ClassName (one per line or comma-separated)...`}
            rows={scopeType === 'codebase' ? 5 : 4}
            className={`w-full ${scopeType === 'codebase' ? 'h-[136px]' : 'h-[136px]'} font-mono text-xs resize-y ${
              isInvalid
                ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                : 'bg-background'
            }`}
            data-tooltip={pathError ? `⚠️ Error: ${pathError}` : undefined}
          />
        </div>

        <FiltersSection
          scopeType={scopeType}
          filter={filter}
          isOpen={isFiltersOpen}
          onOpenChange={onFiltersOpenChange}
          onChangeFilter={onChangeFilter}
          filterSimulatorInput={filterSimulatorInput}
          setFilterSimulatorInput={setFilterSimulatorInput}
        />
      </CollapsibleCard>
    </div>
  );
};

export default PathsSection;

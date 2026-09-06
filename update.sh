#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src/features/exporter/components

# 1. Write webview/src/features/exporter/components/FiltersSection.tsx
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
import { ExportFilter } from '@/shared/services/file-exporter/model/file-exporter-model';
import { useExporterStore } from '../store/useExporterStore';
import { logInfo } from '@/services/view/log-view.service.wrapper';

export type FilterScopeType = 'codebase' | 'reference';

export interface FiltersSectionProps {
  scopeType?: FilterScopeType;
  filter: ExportFilter;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onChangeFilter: (updater: (prev: ExportFilter) => ExportFilter) => void;
  filterSimulatorInput: string;
  setFilterSimulatorInput: (val: string) => void;
}

export const getFilterSummaryBadges = (
  filter: ExportFilter,
  scopeType: FilterScopeType = 'codebase',
  validationState?: any
): BadgeObject[] => {
  const maxFileErr = validationState?.errors?.max_file;
  const incPathsErr = validationState?.errors?.inc_paths;
  const excPathsErr = validationState?.errors?.exc_paths;
  const incExtErr = validationState?.errors?.inc_ext;
  const excExtErr = validationState?.errors?.exc_ext;

  const activeFilter: ExportFilter = filter || {
    src: '',
    max_file: '50',
    inc_paths: '.*',
    exc_paths: '',
    inc_ext: '',
    exc_ext: '',
  };

  const defaultBadgeColor = scopeType === 'codebase'
    ? 'bg-primary/10 text-primary border-primary/20'
    : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30';

  const separator = '\n';
  const incPathLines = (activeFilter.inc_paths || '').split(separator).map((s) => s.trim()).filter(Boolean);
  const incExtLines = (activeFilter.inc_ext || '').split(separator).map((s) => s.trim()).filter(Boolean);
  const excPathLines = (activeFilter.exc_paths || '').split(separator).map((s) => s.trim()).filter(Boolean);
  const excExtLines = (activeFilter.exc_ext || '').split(separator).map((s) => s.trim()).filter(Boolean);

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

  const badges: BadgeObject[] = [
    {
      label: `Max file: ${activeFilter.max_file} KB`,
      tooltip: maxFileErr ? `⚠️ Error: ${maxFileErr}` : `Max file size limit: ${activeFilter.max_file} KB`,
      className: maxFileErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 font-semibold shrink-0'
        : `${defaultBadgeColor} shrink-0 font-bold`,
    },
  ];

  if (incPathCombined || incPathsErr) {
    badges.push({
      label: `Inc Path: ${incPathCombined || 'Invalid Regex'}`,
      tooltip: incPathsErr ? `⚠️ Error: ${incPathsErr}` : `<strong>Inc Path:</strong> <br> ${incPathTooltip}`,
      className: incPathsErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
    });
  }
  if (incExtCombined || incExtErr) {
    badges.push({
      label: `Inc Ext: ${incExtCombined || 'Invalid Regex'}`,
      tooltip: incExtErr ? `⚠️ Error: ${incExtErr}` : `<strong>Inc Ext:</strong> <br> ${incExtTooltip}`,
      className: incExtErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
    });
  }
  if (excPathCombined || excPathsErr) {
    badges.push({
      label: `Exc Path: ${excPathCombined || 'Invalid Regex'}`,
      tooltip: excPathsErr ? `⚠️ Error: ${excPathsErr}` : `<strong>Exc Path:</strong> <br> ${excPathTooltip}`,
      className: excPathsErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
    });
  }
  if (excExtCombined || excExtErr) {
    badges.push({
      label: `Exc Ext: ${excExtCombined || 'Invalid Regex'}`,
      tooltip: excExtErr ? `⚠️ Error: ${excExtErr}` : `<strong>Exc Ext:</strong> <br> ${excExtTooltip}`,
      className: excExtErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
    });
  }

  return badges;
};

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  scopeType = 'codebase',
  filter,
  isOpen = true,
  onOpenChange,
  onChangeFilter,
  filterSimulatorInput = '',
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

  const activeFilter: ExportFilter = filter || {
    src: '',
    max_file: '50',
    inc_paths: '.*',
    exc_paths: '',
    inc_ext: '',
    exc_ext: '',
  };

  const simResult = testFilterPatterns(
    filterSimulatorInput,
    activeFilter.inc_paths || '',
    activeFilter.exc_paths || '',
    activeFilter.inc_ext || '',
    activeFilter.exc_ext || ''
  );

  const summaryBadges = getFilterSummaryBadges(filter, scopeType, validationState);

  const toggleSortLines = (field: keyof ExportFilter) => {
    const currentDir = sortDirections[field] || 'asc';
    const nextDir = currentDir === 'asc' ? 'desc' : 'asc';
    setSortDirections((prev) => ({ ...prev, [field]: nextDir }));

    logInfo('[FiltersSection] toggleSortLines handler triggered', [{ field, direction: nextDir }]);

    onChangeFilter((prev) => {
      const val = String(prev[field] || '');
      const lines = val.split('\n').map((l) => l.trim()).filter(Boolean);
      const commentLines = lines.filter((l) => l.startsWith('#'));
      const activeLines = lines.filter((l) => !l.startsWith('#'));

      activeLines.sort((a, b) => (nextDir === 'asc' ? a.localeCompare(b) : b.localeCompare(a)));
      return { ...prev, [field]: [...commentLines, ...activeLines].join('\n') };
    });
  };

  const explodeRegex = (field: keyof ExportFilter) => {
    logInfo('[FiltersSection] explodeRegex handler triggered', [field]);
    onChangeFilter((prev) => ({
      ...prev,
      [field]: explodeTextAreaRegex(String(prev[field] || '')),
    }));
  };

  const groupExtensions = (field: 'inc_ext' | 'exc_ext') => {
    logInfo('[FiltersSection] groupExtensions handler triggered', [field]);
    onChangeFilter((prev) => ({
      ...prev,
      [field]: groupExtensionsText(String(prev[field] || ''), FILE_EXT_CATEGORY_GROUPS).text,
    }));
  };

  const clearField = (field: keyof ExportFilter) => {
    logInfo('[FiltersSection] clearField handler triggered', [field]);
    onChangeFilter((prev) => ({ ...prev, [field]: '' }));
  };

  const appendExtensionCategory = (field: 'inc_ext' | 'exc_ext', label: string, extensions: string[]) => {
    logInfo('[FiltersSection] appendExtensionCategory handler triggered', [{ field, label, extensions }]);
    onChangeFilter((prev) => {
      const current = prev[field] ? prev[field].split('\n') : [];
      const combined = Array.from(new Set([...current, ...extensions]));
      return { ...prev, [field]: combined.join('\n') };
    });
  };

  const titlePrefix = scopeType === 'codebase' ? '🔍 Codebase' : '🔍 Reference';

  return (
    <CollapsibleCard
      id={`block-${scopeType}-filters`}
      title={`${titlePrefix} Filters & Scope Constraints`}
      tooltip="Regular Expression masks defining targeted directories and source formatting inclusions or exclusions lists."
      summaryBadges={summaryBadges}
      defaultOpen={true}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0 mt-2"
    >
      <div className="space-y-3 w-full min-w-0 font-mono text-xs">
        <div className="flex items-center gap-2 w-full min-w-0">
          <label className="font-semibold text-[11px] text-muted-foreground whitespace-nowrap shrink-0">
            🏋️ Max File ({scopeType})
          </label>
          <Input
            value={activeFilter.max_file}
            onChange={(e) => onChangeFilter((prev) => ({ ...prev, max_file: e.target.value }))}
            className={`w-24 h-7 font-mono text-xs shrink-0 ${
              validationState.maxFileInvalid || maxFileErr
                ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                : 'bg-background'
            }`}
            data-tooltip={maxFileErr ? `⚠️ Error: ${maxFileErr}` : undefined}
          /> KB
        </div>

        <div className="gap-3 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] w-full min-w-0">
          <div className="space-y-2 bg-muted/20 p-2.5 border border-border/40 rounded-md w-full min-w-0">
            <div className="flex justify-between items-center min-w-0 font-semibold text-[11px] text-foreground">
              <span className="truncate">✅ Inclusions</span>
            </div>

            <div className="gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full min-w-0">
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
                  value={activeFilter.inc_paths || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, inc_paths: e.target.value }))}
                  rows={3}
                  className={`w-full min-w-0 font-mono text-xs resize-y ${
                    incPathsErr
                      ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                      : 'bg-background'
                  }`}
                  data-tooltip={incPathsErr ? `⚠️ Error: ${incPathsErr}` : undefined}
                />
              </div>

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
                  value={activeFilter.inc_ext || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, inc_ext: e.target.value }))}
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

          <div className="space-y-2 bg-muted/20 p-2.5 border border-border/40 rounded-md w-full min-w-0">
            <div className="flex justify-between items-center min-w-0 font-semibold text-[11px] text-foreground">
              <span className="truncate">🚫 Exclusions</span>
            </div>

            <div className="gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full min-w-0">
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
                  value={activeFilter.exc_paths || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, exc_paths: e.target.value }))}
                  rows={3}
                  className={`w-full min-w-0 font-mono text-xs resize-y ${
                    excPathsErr
                      ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                      : 'bg-background'
                  }`}
                  data-tooltip={excPathsErr ? `⚠️ Error: ${excPathsErr}` : undefined}
                />
              </div>

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
                  value={activeFilter.exc_ext || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, exc_ext: e.target.value }))}
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

        <div className="flex sm:flex-row flex-col items-stretch sm:items-center gap-2 bg-muted/30 p-2 border border-border rounded-md w-full min-w-0">
          <span className="font-bold text-[11px] text-foreground truncate shrink-0">
            🧪 Filters Simulator:
          </span>
          <Input
            value={filterSimulatorInput || ''}
            onChange={(e) => setFilterSimulatorInput(e.target.value)}
            placeholder={`Enter test ${scopeType} file path to simulate matching...`}
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

# 2. Write webview/src/features/exporter/components/PathsSection.tsx
cat << 'EOF' > webview/src/features/exporter/components/PathsSection.tsx
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FileCode, GitCompare, Bug, ExternalLink, Trash2, X } from 'lucide-react';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { useExporterStore } from '../store/useExporterStore';
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
}) => {
  const workspaceRoot = useExporterStore((s) => s.workspaceRoot);
  const invalidPaths = useExporterStore((s) => s.invalidPaths);
  const validationState = useExporterStore((s) => s.validationState);

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
    const filterBadges = getFilterSummaryBadges(filter, scopeType, validationState);
    if (filterBadges.length > 0) {
      filterBadges.forEach((badge, idx) => {
        summaryBadges.push({
          ...badge,
          newLine: idx === 0 ? true : badge.newLine,
        });
      });
    }
  }

  const totalPathsBadge = (
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
      {lines.length} {lines.length === 1 ? 'path' : 'paths'}
    </span>
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
        title={title}
        tooltip={tooltip}
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
            placeholder={`Enter ${scopeType} directories, files, or Java package.ClassName (one per line or comma-separated)...`}
            rows={scopeType === 'codebase' ? 5 : 4}
            className={`flex-1 ${scopeType === 'codebase' ? 'h-[136px]' : 'h-[136px]'} font-mono text-xs resize-y ${
              isInvalid
                ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                : 'bg-background'
            }`}
            data-tooltip={pathError ? `⚠️ Error: ${pathError}` : undefined}
          />

          <div className="flex flex-col gap-1 shrink-0">
            <Button size="icon-xs" variant="outline" onClick={onAddOpenFiles} data-tooltip="Add Currently Open Editor Files">
              <FileCode size={13} />
            </Button>

            <Button size="icon-xs" variant="outline" onClick={onAddGitDiffFiles} data-tooltip="Add Modified Files from Git Diff">
              <GitCompare size={13} />
            </Button>

            <Button size="icon-xs" variant="outline" onClick={onAddErrorStackFiles} data-tooltip="Extract References from Crash Stack Trace">
              <Bug size={13} />
            </Button>

            <Button size="icon-xs" variant="outline" onClick={onOpenCursorLinePath} data-tooltip="Open Target Path at Cursor Line">
              <ExternalLink size={13} />
            </Button>

            <Button size="icon-xs" variant="outline" onClick={onClearPaths} data-tooltip={`Clear ${scopeType} Paths`} className="hover:text-destructive">
              <Trash2 size={13} />
            </Button>
          </div>
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
EOF

echo "✅ feat: Updated exporter badges with scope-aware colors and collapsible filter summary line."

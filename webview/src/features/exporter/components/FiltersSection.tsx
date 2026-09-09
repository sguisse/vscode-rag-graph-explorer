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
import { useExporterValidation, ValidationFieldName } from '../hooks/use-exporter-validation';
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
  validationState?: any,
  onFocusField?: (fieldKey: string, e: React.MouseEvent) => void
): BadgeObject[] => {
  const maxFileErr = validationState?.errors?.[`${scopeType}_max_file`];
  const incPathsErr = validationState?.errors?.[`${scopeType}_inc_paths`];
  const excPathsErr = validationState?.errors?.[`${scopeType}_exc_paths`];
  const incExtErr = validationState?.errors?.[`${scopeType}_inc_ext`];
  const excExtErr = validationState?.errors?.[`${scopeType}_exc_ext`];

  const activeFilter: ExportFilter = filter || {
    src: '',
    max_file: '50',
    inc_paths: '.*',
    exc_paths: '',
    inc_ext: '',
    exc_ext: '',
  };

  const defaultBadgeColor = scopeType === 'codebase'
    ? 'bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20'
    : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30 cursor-pointer hover:bg-indigo-500/20';

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

  const rawBadges: BadgeObject[] = [
    {
      label: `Max file: ${activeFilter.max_file} KB`,
      tooltip: maxFileErr ? `⚠️ Error: ${maxFileErr}` : `Max file size limit: ${activeFilter.max_file} KB`,
      className: maxFileErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 font-semibold shrink-0 cursor-pointer'
        : `${defaultBadgeColor} shrink-0 font-bold`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocusField?.('max_file', e);
      },
    },
  ];

  if (incPathCombined || incPathsErr) {
    rawBadges.push({
      label: `Inc Path: ${incPathCombined || 'Invalid Regex'}`,
      tooltip: incPathsErr ? `⚠️ Error: ${incPathsErr}` : `<strong>Inc Path:</strong> <br> ${incPathTooltip}`,
      className: incPathsErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold cursor-pointer'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocusField?.('inc_paths', e);
      },
    });
  }
  if (incExtCombined || incExtErr) {
    rawBadges.push({
      label: `Inc Ext: ${incExtCombined || 'Invalid Regex'}`,
      tooltip: incExtErr ? `⚠️ Error: ${incExtErr}` : `<strong>Inc Ext:</strong> <br> ${incExtTooltip}`,
      className: incExtErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold cursor-pointer'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocusField?.('inc_ext', e);
      },
    });
  }
  if (excPathCombined || excPathsErr) {
    rawBadges.push({
      label: `Exc Path: ${excPathCombined || 'Invalid Regex'}`,
      tooltip: excPathsErr ? `⚠️ Error: ${excPathsErr}` : `<strong>Exc Path:</strong> <br> ${excPathTooltip}`,
      className: excPathsErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold cursor-pointer'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocusField?.('exc_paths', e);
      },
    });
  }
  if (excExtCombined || excExtErr) {
    rawBadges.push({
      label: `Exc Ext: ${excExtCombined || 'Invalid Regex'}`,
      tooltip: excExtErr ? `⚠️ Error: ${excExtErr}` : `<strong>Exc Ext:</strong> <br> ${excExtTooltip}`,
      className: excExtErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink font-semibold cursor-pointer'
        : `${defaultBadgeColor} max-w-[280px] sm:max-w-[1000px] min-w-0 truncate shrink`,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocusField?.('exc_ext', e);
      },
    });
  }

  const LINE_BREAK: BadgeObject = {
    label: '',
    className: 'basis-full h-0 w-full border-0 p-0 m-0 pointer-events-none opacity-0 invisible',
  };

  const formattedBadges: BadgeObject[] = [];
  let incCount = 0;
  let excCount = 0;

  rawBadges.forEach((badge) => {
    const labelStr = typeof badge.label === 'string' ? badge.label : '';

    const isMaxBadge = labelStr.toLowerCase().includes('max');
    const isIncBadge = labelStr.toLowerCase().includes('inc path') || labelStr.toLowerCase().includes('inc ext');
    const isExcBadge = labelStr.toLowerCase().includes('exc path') || labelStr.toLowerCase().includes('exc ext');

    if (isMaxBadge) {
      formattedBadges.push(badge);
      if (rawBadges.length > 1) {
        formattedBadges.push(LINE_BREAK);
      }
    } else if (isIncBadge) {
      formattedBadges.push(badge);
      incCount++;
    } else if (isExcBadge) {
      if (excCount === 0 && incCount > 0) {
        formattedBadges.push(LINE_BREAK);
      }
      formattedBadges.push(badge);
      excCount++;
    } else {
      formattedBadges.push(badge);
    }
  });

  return formattedBadges;
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
  const { handleBlur } = useExporterValidation();
  const [sortDirections, setSortDirections] = useState<Record<string, 'asc' | 'desc'>>({
    inc_paths: 'asc',
    inc_ext: 'asc',
    exc_paths: 'asc',
    exc_ext: 'asc',
  });

  const validationState = useExporterStore((s) => s.validationState);
  const maxFileErr = validationState.errors?.[`${scopeType}_max_file`];
  const incPathsErr = validationState.errors?.[`${scopeType}_inc_paths`];
  const excPathsErr = validationState.errors?.[`${scopeType}_exc_paths`];
  const incExtErr = validationState.errors?.[`${scopeType}_inc_ext`];
  const excExtErr = validationState.errors?.[`${scopeType}_exc_ext`];

  const activeFilter: ExportFilter = filter || {
    src: '',
    max_file: '50',
    inc_paths: '.*',
    exc_paths: '',
    inc_ext: '',
    exc_ext: '',
  };

  const handleFocusSelfField = (fieldKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenChange) onOpenChange(true);
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

  const simResult = testFilterPatterns(
    filterSimulatorInput,
    activeFilter.inc_paths || '',
    activeFilter.exc_paths || '',
    activeFilter.inc_ext || '',
    activeFilter.exc_ext || ''
  );

  const summaryBadges = getFilterSummaryBadges(filter, scopeType, validationState, handleFocusSelfField);

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

  const scopePrefix = scopeType === 'codebase' ? 'Codebase' : 'Reference';
  const labelTextColor = scopeType === 'codebase' ? 'text-primary' : 'text-indigo-600';

  return (
    <CollapsibleCard
      id={`block-${scopeType}-filters`}
      title={`🔍 ${scopePrefix} Filters & Scope Constraints`}
      tooltip="Regular Expression masks defining targeted directories and source formatting inclusions or exclusions lists."
      summaryBadges={summaryBadges}
      defaultOpen={false}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0 mt-2"
    >
      <div className="space-y-3 w-full min-w-0 font-mono text-xs">
        <div className="flex items-center gap-2 w-full min-w-0">
          <label className={`font-semibold text-[11px] whitespace-nowrap shrink-0 ${labelTextColor}`}>
            🏋️ {scopePrefix} Max File
          </label>
          <Input
            id={`input-${scopeType}-max-file`}
            value={activeFilter.max_file}
            onChange={(e) => onChangeFilter((prev) => ({ ...prev, max_file: e.target.value }))}
            onBlur={() => handleBlur(`${scopeType}_max_file` as ValidationFieldName)}
            className={`w-24 h-7 font-mono text-xs shrink-0 ${
              maxFileErr
                ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                : 'bg-background'
            }`}
            data-tooltip={maxFileErr ? `⚠️ Error: ${maxFileErr}` : undefined}
          /> KB
        </div>

        <div className="gap-3 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] w-full min-w-0">
          <div className="space-y-2 bg-muted/20 p-2.5 border border-border/40 rounded-md w-full min-w-0">
            <div className="flex justify-between items-center min-w-0 font-semibold text-[11px]">
              <span className={`truncate ${labelTextColor}`}>✅ {scopePrefix} Inclusions</span>
            </div>

            <div className="gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full min-w-0">
              <div className="space-y-1 w-full min-w-0">
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px]">
                  <span className={`truncate ${labelTextColor}`}>Paths</span>
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
                  id={`textarea-${scopeType}-inc-paths`}
                  value={activeFilter.inc_paths || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, inc_paths: e.target.value }))}
                  onBlur={() => handleBlur(`${scopeType}_inc_paths` as ValidationFieldName)}
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
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px]">
                  <span className={`truncate ${labelTextColor}`}>Extensions</span>
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
                  id={`textarea-${scopeType}-inc-ext`}
                  value={activeFilter.inc_ext || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, inc_ext: e.target.value }))}
                  onBlur={() => handleBlur(`${scopeType}_inc_ext` as ValidationFieldName)}
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
            <div className="flex justify-between items-center min-w-0 font-semibold text-[11px]">
              <span className={`truncate ${labelTextColor}`}>🚫 {scopePrefix} Exclusions</span>
            </div>

            <div className="gap-2.5 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] w-full min-w-0">
              <div className="space-y-1 w-full min-w-0">
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px]">
                  <span className={`truncate ${labelTextColor}`}>Paths</span>
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
                  id={`textarea-${scopeType}-exc-paths`}
                  value={activeFilter.exc_paths || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, exc_paths: e.target.value }))}
                  onBlur={() => handleBlur(`${scopeType}_exc_paths` as ValidationFieldName)}
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
                <div className="flex justify-between items-center min-w-0 font-semibold text-[10px]">
                  <span className={`truncate ${labelTextColor}`}>Extensions</span>
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
                  id={`textarea-${scopeType}-exc-ext`}
                  value={activeFilter.exc_ext || ''}
                  onChange={(e) => onChangeFilter((prev) => ({ ...prev, exc_ext: e.target.value }))}
                  onBlur={() => handleBlur(`${scopeType}_exc_ext` as ValidationFieldName)}
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
          <span className={`font-bold text-[11px] truncate shrink-0 ${labelTextColor}`}>
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

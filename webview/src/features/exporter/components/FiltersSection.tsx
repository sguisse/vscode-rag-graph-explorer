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
import { logInfo } from '@/services/view/log-view.service.wrapper';

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

    logInfo('[FiltersSection] toggleSortLines handler triggered', [{ field, direction: nextDir }]);

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
    logInfo('[FiltersSection] explodeRegex handler triggered', [field]);
    onChangeConfig((prev) => {
      const val = String(prev[field] || '');
      const exploded = explodeTextAreaRegex(val);
      return { ...prev, [field]: exploded };
    });
  };

  const groupExtensions = (field: 'inc_ext' | 'exc_ext') => {
    logInfo('[FiltersSection] groupExtensions handler triggered', [field]);
    onChangeConfig((prev) => {
      const val = String(prev[field] || '');
      const result = groupExtensionsText(val, FILE_EXT_CATEGORY_GROUPS);
      return { ...prev, [field]: result.text };
    });
  };

  const clearField = (field: keyof ExportConfig) => {
    logInfo('[FiltersSection] clearField handler triggered', [field]);
    onChangeConfig((prev) => ({ ...prev, [field]: '' }));
  };

  const appendExtensionCategory = (field: 'inc_ext' | 'exc_ext', label: string, extensions: string[]) => {
    logInfo('[FiltersSection] appendExtensionCategory handler triggered', [{ field, label, extensions }]);
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

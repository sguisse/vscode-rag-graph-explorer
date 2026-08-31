import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowDownAZ, Trash2, MoreVertical } from 'lucide-react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { FILE_EXT_CATEGORY_GROUPS } from '../constants/exporter-constants';
import { testFilterPatterns } from '../utils/filter-simulator';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

interface FiltersSectionProps {
  config: ExportConfig;
  onChangeConfig: (updater: (prev: ExportConfig) => ExportConfig) => void;
  filterSimulatorInput: string;
  setFilterSimulatorInput: (val: string) => void;
}

export const FiltersSection: React.FC<FiltersSectionProps> = ({
  config,
  onChangeConfig,
  filterSimulatorInput,
  setFilterSimulatorInput,
}) => {
  const simResult = testFilterPatterns(
    filterSimulatorInput,
    config.inc_paths,
    config.exc_paths,
    config.inc_ext,
    config.exc_ext
  );

  const sortLines = (field: keyof ExportConfig) => {
    onChangeConfig((prev) => {
      const val = String(prev[field] || '');
      const lines = val.split('\n').map((l) => l.trim()).filter(Boolean);
      lines.sort((a, b) => a.localeCompare(b));
      return { ...prev, [field]: lines.join('\n') };
    });
  };

  const clearField = (field: keyof ExportConfig) => {
    onChangeConfig((prev) => ({ ...prev, [field]: '' }));
  };

  const appendExtensionCategory = (field: 'inc_ext' | 'exc_ext', extensions: string[]) => {
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
      summaryText={`Max file: ${config.max_file} KB`}
      defaultOpen={true}
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
                    <Button size="icon-xs" variant="ghost" onClick={() => sortLines('inc_paths')} title="Sort lines">
                      <ArrowDownAZ size={11} />
                    </Button>
                    <Button size="icon-xs" variant="ghost" onClick={() => clearField('inc_paths')} title="Clear field">
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
                    <Button size="icon-xs" variant="ghost" onClick={() => sortLines('inc_ext')} title="Sort lines">
                      <ArrowDownAZ size={11} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost" title="Category Presets">
                          <MoreVertical size={11} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {FILE_EXT_CATEGORY_GROUPS.filter((g) => g.includeExtsMenuEnabled).map(
                          (grp) => (
                            <DropdownMenuItem
                              key={grp.label}
                              onClick={() => appendExtensionCategory('inc_ext', grp.extensions)}
                            >
                              {grp.label}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="icon-xs" variant="ghost" onClick={() => clearField('inc_ext')} title="Clear field">
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
                    <Button size="icon-xs" variant="ghost" onClick={() => sortLines('exc_paths')} title="Sort lines">
                      <ArrowDownAZ size={11} />
                    </Button>
                    <Button size="icon-xs" variant="ghost" onClick={() => clearField('exc_paths')} title="Clear field">
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
                    <Button size="icon-xs" variant="ghost" onClick={() => sortLines('exc_ext')} title="Sort lines">
                      <ArrowDownAZ size={11} />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-xs" variant="ghost" title="Category Presets">
                          <MoreVertical size={11} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {FILE_EXT_CATEGORY_GROUPS.filter((g) => g.excludeExtsMenuEnabled).map(
                          (grp) => (
                            <DropdownMenuItem
                              key={grp.label}
                              onClick={() => appendExtensionCategory('exc_ext', grp.extensions)}
                            >
                              {grp.label}
                            </DropdownMenuItem>
                          )
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="icon-xs" variant="ghost" onClick={() => clearField('exc_ext')} title="Clear field">
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
            <span className="px-1 text-base shrink-0" title={simResult.reason}>
              {!filterSimulatorInput.trim()
                ? '❓'
                : simResult.isMatched
                ? '✅'
                : '🚫'}
            </span>
            <span className="max-w-[140px] sm:max-w-[200px] font-mono text-[10px] text-muted-foreground truncate" title={simResult.reason}>
              {filterSimulatorInput.trim() ? simResult.reason : 'Idle'}
            </span>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default FiltersSection;

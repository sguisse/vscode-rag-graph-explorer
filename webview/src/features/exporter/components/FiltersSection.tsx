import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowDownAZ, Trash2, MoreVertical } from 'lucide-react';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { ExportConfig } from '../types/exporter.types';
import { FILE_EXT_CATEGORY_GROUPS } from '../constants/exporter-constants';
import { testFilterPatterns } from '../utils/filter-simulator';

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
      className="m-1 shrink-0"
    >
      <div className="space-y-3 font-mono text-xs">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] text-muted-foreground block font-semibold">
              🏋️ Max File (KB)
            </label>
            <Input
              value={config.max_file}
              onChange={(e) =>
                onChangeConfig((prev) => ({ ...prev, max_file: e.target.value }))
              }
              className="h-7 text-xs font-mono bg-background"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
              <span>✅ Include Paths</span>
              <div className="flex gap-0.5">
                <Button size="icon-xs" variant="ghost" onClick={() => sortLines('inc_paths')}>
                  <ArrowDownAZ size={11} />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={() => clearField('inc_paths')}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            <Textarea
              value={config.inc_paths}
              onChange={(e) =>
                onChangeConfig((prev) => ({ ...prev, inc_paths: e.target.value }))
              }
              rows={4}
              className="font-mono text-xs resize-y bg-background"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
              <span>🟢 Include exts</span>
              <div className="flex gap-0.5">
                <Button size="icon-xs" variant="ghost" onClick={() => sortLines('inc_ext')}>
                  <ArrowDownAZ size={11} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-xs" variant="ghost">
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
                <Button size="icon-xs" variant="ghost" onClick={() => clearField('inc_ext')}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            <Textarea
              value={config.inc_ext}
              onChange={(e) =>
                onChangeConfig((prev) => ({ ...prev, inc_ext: e.target.value }))
              }
              rows={4}
              className="font-mono text-xs resize-y bg-background"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
              <span>🚫 Exclude Paths</span>
              <div className="flex gap-0.5">
                <Button size="icon-xs" variant="ghost" onClick={() => sortLines('exc_paths')}>
                  <ArrowDownAZ size={11} />
                </Button>
                <Button size="icon-xs" variant="ghost" onClick={() => clearField('exc_paths')}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            <Textarea
              value={config.exc_paths}
              onChange={(e) =>
                onChangeConfig((prev) => ({ ...prev, exc_paths: e.target.value }))
              }
              rows={4}
              className="font-mono text-xs resize-y bg-background"
            />
          </div>

          <div className="space-y-1 md:col-span-1">
            <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
              <span>🔴 Exclude exts</span>
              <div className="flex gap-0.5">
                <Button size="icon-xs" variant="ghost" onClick={() => sortLines('exc_ext')}>
                  <ArrowDownAZ size={11} />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-xs" variant="ghost">
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
                <Button size="icon-xs" variant="ghost" onClick={() => clearField('exc_ext')}>
                  <Trash2 size={11} />
                </Button>
              </div>
            </div>
            <Textarea
              value={config.exc_ext}
              onChange={(e) =>
                onChangeConfig((prev) => ({ ...prev, exc_ext: e.target.value }))
              }
              rows={4}
              className="font-mono text-xs resize-y bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/30 p-1.5 border border-border rounded">
          <span className="text-[11px] font-bold text-foreground shrink-0">
            🧪 Filters Simulator:
          </span>
          <Input
            value={filterSimulatorInput}
            onChange={(e) => setFilterSimulatorInput(e.target.value)}
            placeholder="Enter test file path or name to simulate matching rules..."
            className="h-6 text-xs font-mono flex-1 bg-background"
          />
          <span
            className="text-sm px-1 shrink-0"
            title={simResult.reason}
          >
            {!filterSimulatorInput.trim()
              ? '❓'
              : simResult.isMatched
              ? '✅'
              : '🚫'}
          </span>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default FiltersSection;

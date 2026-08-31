import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { EXPORT_FORMAT_ICON_MAP, EXPORT_FORMAT_LIST, ExportFormat } from '@/shared/services/codebase-exporter/types/type-export-format';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';

interface OutputFormattingSectionProps {
  config: ExportConfig;
  onChangeConfig: (updater: (prev: ExportConfig) => ExportConfig) => void;
}

export const OutputFormattingSection: React.FC<OutputFormattingSectionProps> = ({
  config,
  onChangeConfig,
}) => {
  return (
    <CollapsibleCard
      id="block-options"
      title="⚙️ Output Formatting & Rules"
      tooltip="Aggregated output payload formats schemas, text partitions thresholds, chunk splits and logging rules."
      summaryText={`Format: ${config.format.toUpperCase()} | Chunk: ${config.max_chunk} KB`}
      defaultOpen={true}
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
              onChange={(e) =>
                onChangeConfig((prev) => ({ ...prev, max_chunk: e.target.value }))
              }
              className="bg-background w-full h-7 font-mono text-xs"
            />
          </div>
        </div>

        {/* Responsive Checkbox Grid with Uniform Equal Width Items */}
        <div className="gap-2 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] pt-2 border-border/40 border-t w-full min-w-0">
          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-split-ext"
              checked={config.groupByExt}
              onCheckedChange={(val) =>
                onChangeConfig((prev) => ({ ...prev, groupByExt: Boolean(val) }))
              }
            />
            <label htmlFor="cb-split-ext" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Split by Ext
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-copy-clip"
              checked={config.copyGeneratedFilesToClipboard}
              onCheckedChange={(val) =>
                onChangeConfig((prev) => ({
                  ...prev,
                  copyGeneratedFilesToClipboard: Boolean(val),
                }))
              }
            />
            <label htmlFor="cb-copy-clip" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Copy to Clip
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-tree-view"
              checked={config.generateTreeView}
              onCheckedChange={(val) =>
                onChangeConfig((prev) => ({ ...prev, generateTreeView: Boolean(val) }))
              }
            />
            <label htmlFor="cb-tree-view" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Tree View
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-log-console"
              checked={config.logConsole}
              onCheckedChange={(val) =>
                onChangeConfig((prev) => ({ ...prev, logConsole: Boolean(val) }))
              }
            />
            <label htmlFor="cb-log-console" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Log Console
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors">
            <Checkbox
              id="cb-log-file"
              checked={config.logFile}
              onCheckedChange={(val) =>
                onChangeConfig((prev) => ({ ...prev, logFile: Boolean(val) }))
              }
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

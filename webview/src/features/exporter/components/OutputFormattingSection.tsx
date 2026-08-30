import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { ExportConfig, ExportFormat } from '../types/exporter.types';

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
      className="m-1 shrink-0"
    >
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 items-end font-mono text-xs">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-semibold block">
            Output Format
          </label>
          <Select
            value={config.format}
            onValueChange={(val: string | null) => {
              if (val) onChangeConfig((prev) => ({ ...prev, format: val as ExportFormat }));
            }}
          >
            <SelectTrigger className="h-7 text-xs font-mono bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yaml">YAML</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
              <SelectItem value="toml">TOML</SelectItem>
              <SelectItem value="txt">TXT</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground font-semibold block">
            Max Chunk (KB)
          </label>
          <Input
            value={config.max_chunk}
            onChange={(e) =>
              onChangeConfig((prev) => ({ ...prev, max_chunk: e.target.value }))
            }
            className="h-7 text-xs font-mono bg-background"
          />
        </div>

        <div className="flex items-center gap-1.5 h-7">
          <Checkbox
            id="cb-split-ext"
            checked={config.groupByExt}
            onCheckedChange={(val) =>
              onChangeConfig((prev) => ({ ...prev, groupByExt: Boolean(val) }))
            }
          />
          <label htmlFor="cb-split-ext" className="text-[10px] cursor-pointer">
            Split by Ext
          </label>
        </div>

        <div className="flex items-center gap-1.5 h-7">
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
          <label htmlFor="cb-copy-clip" className="text-[10px] cursor-pointer">
            Copy to Clip
          </label>
        </div>

        <div className="flex items-center gap-1.5 h-7">
          <Checkbox
            id="cb-tree-view"
            checked={config.generateTreeView}
            onCheckedChange={(val) =>
              onChangeConfig((prev) => ({ ...prev, generateTreeView: Boolean(val) }))
            }
          />
          <label htmlFor="cb-tree-view" className="text-[10px] cursor-pointer">
            Tree View
          </label>
        </div>

        <div className="flex items-center gap-1.5 h-7">
          <Checkbox
            id="cb-log-console"
            checked={config.logConsole}
            onCheckedChange={(val) =>
              onChangeConfig((prev) => ({ ...prev, logConsole: Boolean(val) }))
            }
          />
          <label htmlFor="cb-log-console" className="text-[10px] cursor-pointer">
            Log Console
          </label>
        </div>

        <div className="flex items-center gap-1.5 h-7">
          <Checkbox
            id="cb-log-file"
            checked={config.logFile}
            onCheckedChange={(val) =>
              onChangeConfig((prev) => ({ ...prev, logFile: Boolean(val) }))
            }
          />
          <label htmlFor="cb-log-file" className="text-[10px] cursor-pointer">
            Log File
          </label>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default OutputFormattingSection;

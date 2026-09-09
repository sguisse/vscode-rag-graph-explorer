import React from 'react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CollapsibleCard, BadgeObject } from '@/components/ui/collapsible-card';
import { EXPORT_FORMAT_ICON_MAP, EXPORT_FORMAT_LIST, ExportFormat } from '@/shared/services/codebase-exporter/types/type-export-format.gen';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ExportConfig } from '@/shared/services/file-exporter/model/file-exporter-model';
import { useExporterStore } from '../store/useExporterStore';
import { useExporterValidation } from '../hooks/use-exporter-validation';
import { logInfo } from '@/services/view/log-view.service.wrapper';

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
  const { handleBlur } = useExporterValidation();
  const maxChunkErr = validationState?.errors?.max_chunk;

  const isPromptFileEnabled = config.generatePromptFile !== false;

  const handleFocusField = (elementId: string, e: React.MouseEvent, isSelect = false) => {
    e.stopPropagation();
    if (onOpenChange) onOpenChange(true);

    const attemptFocus = (retries = 15) => {
      const root = document.getElementById(elementId);
      if (!root) {
        if (retries > 0) setTimeout(() => attemptFocus(retries - 1), 40);
        return;
      }

      const target = root.matches('button, input, [role="combobox"]')
        ? root
        : (root.querySelector('button, input, [role="combobox"]') as HTMLElement) || root;

      if (target) {
        try {
          target.focus({ preventScroll: true });
        } catch {
          target.focus();
        }

        if ('select' in target && typeof (target as any).select === 'function') {
          (target as HTMLInputElement).select();
        }

        if (isSelect) {
          target.click();
        }
      }
    };

    setTimeout(() => attemptFocus(), 60);
  };

  const chkIdMap: Record<string, string> = {
    'Split by Ext': 'cb-split-ext',
    'Copy to Clip': 'cb-copy-clip',
    'Tree View': 'cb-tree-view',
    'Log Console': 'cb-log-console',
    'Log File': 'cb-log-file',
    'Prompt File': 'cb-prompt-file',
  };

  const activeCheckboxes: string[] = [];
  if (config.groupByExt) activeCheckboxes.push('Split by Ext');
  if (config.copyGeneratedFilesToClipboard) activeCheckboxes.push('Copy to Clip');
  if (config.generateTreeView) activeCheckboxes.push('Tree View');
  if (config.logConsole) activeCheckboxes.push('Log Console');
  if (config.logFile) activeCheckboxes.push('Log File');
  if (isPromptFileEnabled) activeCheckboxes.push('Prompt File');

  const summaryBadges: BadgeObject[] = [
    {
      label: `Format: ${(config.format || 'yaml').toUpperCase()}`,
      tooltip: `Output Format: ${(config.format || 'yaml').toUpperCase()}`,
      className: 'bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20',
      onClick: (e) => handleFocusField('select-export-format', e, true),
    },
    {
      label: `Chunk: ${config.max_chunk || '0'} KB`,
      tooltip: maxChunkErr ? `⚠️ Error: ${maxChunkErr}` : `Max Chunk Size: ${config.max_chunk || '0'} KB`,
      className: maxChunkErr
        ? 'bg-destructive/10 text-destructive border-destructive/30 font-semibold cursor-pointer'
        : 'bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20',
      onClick: (e) => handleFocusField('input-max-chunk', e),
    },
    ...activeCheckboxes.map((chk) => ({
      label: chk,
      tooltip: `Rule enabled: ${chk}`,
      className: 'bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20',
      onClick: (e: React.MouseEvent) => handleFocusField(chkIdMap[chk] || 'cb-split-ext', e),
    })),
  ];

  return (
    <CollapsibleCard
      id="block-options"
      title="📦 Output Formatting & Rules"
      tooltip="Aggregated output payload formats schemas, text partitions thresholds, chunk splits and logging rules."
      summaryBadges={summaryBadges}
      defaultOpen={false}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      className="w-full min-w-0 shrink-0"
    >
      <div className="flex flex-col space-y-3 w-full min-w-0 font-mono text-xs">
        <div className="gap-2.5 grid grid-cols-1 sm:grid-cols-2 w-full min-w-0">
          <div className="space-y-1 w-full min-w-0">
            <label className="block font-semibold text-[10px] text-muted-foreground truncate">
              Output Format
            </label>
            <SelectFromTypeBuilder
              id="select-export-format"
              value={config.format || 'yaml'}
              onChange={(val) => {
                if (val) {
                  logInfo('[OutputFormattingSection] Format changed', [val]);
                  onChangeConfig((prev) => ({ ...prev, format: val as ExportFormat }));
                }
              }}
              triggerClassName="!h-7 min-h-0 py-0 px-2 text-xs border-border rounded-md font-mono w-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 data-[state=open]:ring-2 data-[state=open]:ring-ring data-[state=open]:ring-offset-1 transition-all"
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
              id="input-max-chunk"
              value={config.max_chunk || ''}
              onChange={(e) => {
                logInfo('[OutputFormattingSection] Max chunk changed', [e.target.value]);
                onChangeConfig((prev) => ({ ...prev, max_chunk: e.target.value }));
              }}
              onBlur={() => handleBlur('max_chunk')}
              className={`w-full h-7 font-mono text-xs ${
                validationState?.maxChunkInvalid || maxChunkErr
                  ? 'bg-destructive/10 text-destructive border-destructive/30 focus-visible:ring-destructive'
                  : 'bg-background'
              }`}
              data-tooltip={maxChunkErr ? `⚠️ Error: ${maxChunkErr}` : undefined}
            />
          </div>
        </div>

        <div className="gap-2 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] pt-2 border-border/40 border-t w-full min-w-0">
          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
            <Checkbox
              id="cb-split-ext"
              checked={Boolean(config.groupByExt)}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] groupByExt changed', [Boolean(val)]);
                onChangeConfig((prev) => ({ ...prev, groupByExt: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-split-ext" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Split by Ext
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
            <Checkbox
              id="cb-copy-clip"
              checked={Boolean(config.copyGeneratedFilesToClipboard)}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] copyGeneratedFilesToClipboard changed', [Boolean(val)]);
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

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
            <Checkbox
              id="cb-tree-view"
              checked={Boolean(config.generateTreeView)}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] generateTreeView changed', [Boolean(val)]);
                onChangeConfig((prev) => ({ ...prev, generateTreeView: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-tree-view" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Tree View
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
            <Checkbox
              id="cb-log-console"
              checked={Boolean(config.logConsole)}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] logConsole changed', [Boolean(val)]);
                onChangeConfig((prev) => ({ ...prev, logConsole: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-log-console" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Log Console
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
            <Checkbox
              id="cb-log-file"
              checked={Boolean(config.logFile)}
              onCheckedChange={(val) => {
                logInfo('[OutputFormattingSection] logFile changed', [Boolean(val)]);
                onChangeConfig((prev) => ({ ...prev, logFile: Boolean(val) }));
              }}
            />
            <label htmlFor="cb-log-file" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Log File
            </label>
          </div>

          <div className="flex justify-start items-center gap-2 bg-muted/20 hover:bg-muted/40 p-1.5 border border-border/30 rounded-sm w-full min-w-0 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background">
            <Checkbox
              id="cb-prompt-file"
              checked={isPromptFileEnabled}
              onCheckedChange={(val) => {
                const isChecked = val === true;
                logInfo('[OutputFormattingSection] generatePromptFile changed', [isChecked]);

                onChangeConfig((prev) => ({ ...prev, generatePromptFile: isChecked }));

                useExporterStore.setState((state) => ({
                  config: {
                    ...state.config,
                    generatePromptFile: isChecked,
                  },
                }));
              }}
            />
            <label htmlFor="cb-prompt-file" className="font-medium text-[10px] truncate cursor-pointer select-none">
              Prompt File
            </label>
          </div>
        </div>
      </div>
    </CollapsibleCard>
  );
};

export default OutputFormattingSection;

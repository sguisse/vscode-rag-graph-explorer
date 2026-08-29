import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import OUTPUT_TEMPLATES_DATA from './data/output-templates.yaml';

const FORMAT_OPTIONS = ['json', 'yaml', 'xml', 'markdown', 'plaintext'] as const;

interface TemplateTabProps {
  outputTemplate: string;
  outputFormat: string;
  onUpdateOutputTemplate: (template: string) => void;
  onUpdateOutputFormat: (format: string) => void;
}

export const TemplateTab: React.FC<TemplateTabProps> = ({
  outputTemplate,
  outputFormat,
  onUpdateOutputTemplate,
  onUpdateOutputFormat,
}) => {
  const templatesMap = (OUTPUT_TEMPLATES_DATA as Record<string, string>) || {};

  const handleFormatChange = (fmt: string) => {
    onUpdateOutputFormat(fmt);
    const defaultTemplate = templatesMap[fmt] || templatesMap.json || '';
    if (defaultTemplate) {
      onUpdateOutputTemplate(defaultTemplate);
    }
  };

  const handleResetTemplate = () => {
    const defaultTemplate = templatesMap[outputFormat] || templatesMap.json || '';
    if (defaultTemplate) {
      onUpdateOutputTemplate(defaultTemplate);
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-2 p-2 font-mono text-xs bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border pb-1.5 shrink-0">
        <span className="font-bold text-muted-foreground uppercase text-[10px]">Output Format:</span>
        <div className="flex items-center gap-1">
          {FORMAT_OPTIONS.map((fmt) => {
            const isSelected = outputFormat === fmt;
            return (
              <Button
                key={fmt}
                variant="ghost"
                size="sm"
                onClick={() => handleFormatChange(fmt)}
                data-tooltip={`Select ${fmt.toUpperCase()} output format`}
                className={`h-5 px-1.5 text-[10px] uppercase font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent'
                }`}
              >
                {fmt}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 min-h-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-muted-foreground uppercase text-[10px]">Mustache Template Schema:</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetTemplate}
            className="h-5 w-5 text-muted-foreground hover:text-foreground cursor-pointer"
            data-tooltip="Reset to default Mustache template schema for current format"
          >
            <RotateCcw size={12} />
          </Button>
        </div>
        <Textarea
          value={outputTemplate}
          onChange={(e) => onUpdateOutputTemplate(e.target.value)}
          placeholder="Enter Mustache template (e.g. {{title}}, {{description}}, {{raw_content}})..."
          className="flex-1 bg-slate-950 text-slate-200 border-slate-800 font-mono text-xs resize-none"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

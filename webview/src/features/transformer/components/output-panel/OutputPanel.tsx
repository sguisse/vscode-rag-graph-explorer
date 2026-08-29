import React from 'react';
import { Eye, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOutputPanel } from './hooks/use-output-panel';
import { OutputPanelProps } from './types/output-panel.types';
import { PreviewTab } from './tabs/PreviewTab';
import { TemplateTab } from './tabs/TemplateTab';

export const OutputPanel: React.FC<OutputPanelProps> = ({
  renderedOutput,
  outputFormat,
  outputTemplate,
  onCopy,
  onUpdateOutputTemplate,
  onUpdateOutputFormat,
}) => {
  const { activeTab, setActiveTab } = useOutputPanel();

  return (
    <div className="flex flex-col h-full w-full bg-card min-h-0 font-mono text-xs">
      {/* Tab Navigation Toolbar */}
      <div className="flex items-center gap-1 bg-muted/60 p-1 border-b border-border shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('template')}
          className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
            activeTab === 'template'
              ? 'bg-background text-foreground border border-border/60 shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
          }`}
        >
          <LayoutTemplate size={13} className={activeTab === 'template' ? 'text-primary' : ''} />
          <span>Template</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('preview')}
          className={`h-6 px-2.5 text-[11px] gap-1.5 cursor-pointer font-bold transition-all rounded-md ${
            activeTab === 'preview'
              ? 'bg-background text-foreground border border-border/60 shadow-xs'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/40 border border-transparent'
          }`}
        >
          <Eye size={13} className={activeTab === 'preview' ? 'text-primary' : ''} />
          <span>Preview</span>
        </Button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 min-h-0 overflow-hidden relative">
        {activeTab === 'template' && (
          <TemplateTab
            outputTemplate={outputTemplate}
            outputFormat={outputFormat}
            onUpdateOutputTemplate={onUpdateOutputTemplate}
            onUpdateOutputFormat={onUpdateOutputFormat}
          />
        )}
        {activeTab === 'preview' && (
          <PreviewTab
            renderedOutput={renderedOutput}
            outputFormat={outputFormat}
            onCopy={onCopy}
          />
        )}
      </div>
    </div>
  );
};

export default OutputPanel;

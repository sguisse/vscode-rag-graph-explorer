import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardPaste, FileCode, Play } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';

interface ApplyResponsePanelProps {
  llmResponse: string;
  onChangeLlmResponse: (val: string) => void;
  onPaste: () => void;
  onExtractSh: () => void;
  onApplySh: () => void;
}

export const ApplyResponsePanel: React.FC<ApplyResponsePanelProps> = ({
  llmResponse,
  onChangeLlmResponse,
  onPaste,
  onExtractSh,
  onApplySh,
}) => {
  const middleContent = (
    <div className="p-3 h-full min-h-0 flex flex-col space-y-2 font-mono text-xs">
      <div className="flex items-center justify-between">
        <label htmlFor="textarea-llm-response" className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <span>🤖 LLM Response</span>
        </label>
        <Button
          size="sm"
          variant="ghost"
          onClick={onPaste}
          data-tooltip="Paste LLM Response from Clipboard"
          className="h-7 px-2 text-xs font-mono gap-1.5 cursor-pointer hover:bg-muted"
        >
          <ClipboardPaste size={14} className="text-primary" />
          <span>Paste</span>
        </Button>
      </div>
      <Textarea
        id="textarea-llm-response"
        value={llmResponse}
        onChange={(e) => onChangeLlmResponse(e.target.value)}
        placeholder="Paste full LLM response containing Bash script here..."
        className="flex-1 w-full h-full font-mono text-xs bg-card resize-none border-border focus-visible:ring-1"
        spellCheck={false}
      />
    </div>
  );

  const bottomContent = (
    <div className="p-3 bg-card border-t border-border flex items-center justify-end gap-3 font-mono text-xs">
      <Button
        type="button"
        variant="outline"
        onClick={onExtractSh}
        className="h-8 px-4 font-bold gap-2 text-xs cursor-pointer"
        data-tooltip="Extract Shell Script block from LLM response"
      >
        <FileCode size={14} className="text-primary" />
        <span>Extract SH script</span>
      </Button>
      <Button
        type="button"
        onClick={onApplySh}
        className="h-8 px-5 font-bold gap-2 text-xs bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-white cursor-pointer shadow-sm"
        data-tooltip="Execute and apply the extracted Shell Script to workspace"
      >
        <Play size={14} className="fill-current" />
        <span>Apply SH Script</span>
      </Button>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-apply-response"
      className="w-full h-full min-h-0 overflow-hidden bg-background"
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default ApplyResponsePanel;

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Sparkles } from 'lucide-react';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';
import { usePromptTab } from './hooks/use-prompt-tab';

export const PromptTab: React.FC = () => {
  const {
    selectedPromptId,
    promptText,
    setPromptText,
    handleSelectPrompt,
    handleCopyWithFullContext,
    predefinedPrompts,
  } = usePromptTab();

  const topContent = (
    <div className="flex items-center gap-2 p-2 bg-card border-b border-border font-mono text-xs w-full shrink-0">
      <span className="font-bold text-[11px] text-foreground shrink-0 flex items-center gap-1.5">
        <Sparkles size={13} className="text-primary" />
        Predefined Prompt:
      </span>
      <Select
        value={selectedPromptId}
        onValueChange={(val: string | null) => {
          if (val) handleSelectPrompt(val);
        }}
      >
        <SelectTrigger className="flex-1 h-7 font-mono text-xs bg-background">
          <SelectValue placeholder="Select Predefined Prompt Template..." />
        </SelectTrigger>
        <SelectContent>
          {predefinedPrompts.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const middleContent = (
    <div className="p-2 h-full min-h-0 flex flex-col font-mono text-xs bg-background">
      <Textarea
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder="Select a predefined prompt or compose your custom LLM prompt..."
        className="flex-1 w-full h-full font-mono text-xs bg-card resize-none border-border focus-visible:ring-1"
        spellCheck={false}
      />
    </div>
  );

  const bottomContent = (
    <LeftCenterRightPanel
      id="panel-prompt-footer"
      className="p-2 bg-card border-t border-border font-mono text-xs shrink-0"
      right={
        <Button
          size="sm"
          onClick={handleCopyWithFullContext}
          className="h-7 px-4 gap-1.5 text-xs font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Copy size={13} />
          <span>Copy with full context</span>
        </Button>
      }
    />
  );

  return (
    <TopMiddleBottomPanel
      id="panel-prompt-tab"
      className="w-full h-full min-h-0 overflow-hidden bg-background font-mono text-xs"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
    />
  );
};

export default PromptTab;

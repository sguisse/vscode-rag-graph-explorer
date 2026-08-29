import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface InputPanelProps {
  inputText: string;
  setInputText: (val: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ inputText, setInputText }) => {
  return (
    <div className="flex flex-col h-full w-full gap-2 font-mono text-xs bg-background">
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste input HTML, XML, Markdown, or raw text content..."
        className="flex-1 min-h-[140px] bg-muted/20 font-mono text-xs resize-y border-border"
        spellCheck={false}
      />
    </div>
  );
};

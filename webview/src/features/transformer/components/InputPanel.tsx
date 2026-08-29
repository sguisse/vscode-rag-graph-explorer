import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface InputPanelProps {
  inputText: string;
  setInputText: (val: string) => void;
}

export const InputPanel: React.FC<InputPanelProps> = ({ inputText, setInputText }) => {
  return (
    <div className="flex flex-col h-full w-full font-mono text-xs bg-background p-1.5">
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Paste input HTML, XML, Markdown, or raw text content..."
        className="flex-1 h-full bg-muted/20 font-mono text-xs resize-none border-border"
        spellCheck={false}
      />
    </div>
  );
};

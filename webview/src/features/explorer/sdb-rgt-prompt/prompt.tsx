import React from 'react';
import { Copy, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import PREDEFINED_PROMPTS from './data/predefined-prompts.yaml';
import TEMPLATE_PROMPTS from './data/template-prompts.yaml';
import { AGENTS_LIST } from './data/data-constants';
import { FilesCtxExportPanel } from '../components/files-ctx-export/files-ctx-export-panel';
import { usePrompt } from './hooks/use-prompt';

interface PromptPanelProps {
  handleCopy?: (text: string, message: string) => void;
}

export function PromptPanel({ handleCopy }: PromptPanelProps) {
  const {
    promptFields,
    updatePromptFields,
    selectedTemplateId,
    setSelectedTemplateId,
    handlePredefinedChange,
    handleCopyPrompt,
    handleInsertAgent,
  } = usePrompt(handleCopy);

  const topContent = (
    <div className="space-y-2 bg-muted/20 p-2.5 border border-border rounded-lg w-full">
      <div className="space-y-1 w-full">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">
          Predefined :
        </label>
        <Select
          value={promptFields.predefined}
          onValueChange={(val) => val && handlePredefinedChange(val)}
        >
          <SelectTrigger className="bg-background h-8 text-xs">
            <SelectValue placeholder="Select a predefined prompt preset..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">✍️ Custom Prompt</SelectItem>
            {PREDEFINED_PROMPTS.map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const middleContent = (
    <div className="space-y-3 py-2 pr-1 w-full font-mono text-xs">
      <div className="space-y-2 bg-card p-2.5 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 font-bold text-[10px] text-foreground uppercase cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={promptFields.mode === 'role'}
                onChange={() => updatePromptFields({ mode: 'role' })}
                className="text-primary cursor-pointer"
              />
              <User size={12} className="text-primary" /> Role
            </label>
            <label className="flex items-center gap-1 font-bold text-[10px] text-foreground uppercase cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={promptFields.mode === 'agent'}
                onChange={() => updatePromptFields({ mode: 'agent' })}
                className="text-primary cursor-pointer"
              />
              <Bot size={12} className="text-indigo-400" /> Agent
            </label>
          </div>

          {promptFields.mode === 'agent' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleInsertAgent}
              className="h-6 text-[10px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              <Sparkles size={10} className="mr-1" /> Add Agent to Field
            </Button>
          )}
        </div>

        {promptFields.mode === 'agent' && (
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] text-muted-foreground uppercase shrink-0">Agent List:</span>
            <Select
              value={promptFields.selectedAgent}
              onValueChange={(val) => val && updatePromptFields({ selectedAgent: val })}
            >
              <SelectTrigger className="flex-1 bg-background h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AGENTS_LIST.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    🤖 {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Textarea
          value={promptFields.roleOrAgent}
          onChange={(e) => updatePromptFields({ roleOrAgent: e.target.value })}
          placeholder={
            promptFields.mode === 'agent'
              ? 'Specify Agent role description...'
              : 'Specify Role title...'
          }
          className="bg-background min-h-14 font-mono text-xs resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">🗣 tone :</label>
        <Textarea
          value={promptFields.tone}
          onChange={(e) => updatePromptFields({ tone: e.target.value })}
          placeholder="Define communication tone and style..."
          className="bg-background min-h-10 font-mono text-xs resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">🧠 context :</label>
        <Textarea
          value={promptFields.context}
          onChange={(e) => updatePromptFields({ context: e.target.value })}
          placeholder="Describe technical context and background..."
          className="bg-background min-h-16 font-mono text-xs resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">🎯 Expected :</label>
        <Textarea
          value={promptFields.expected}
          onChange={(e) => updatePromptFields({ expected: e.target.value })}
          placeholder="Specify expected deliverables and constraints..."
          className="bg-background min-h-30 font-mono text-xs resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">🧭 Output :</label>
        <Textarea
          value={promptFields.output}
          onChange={(e) => updatePromptFields({ output: e.target.value })}
          placeholder="Format requirements (e.g., Markdown, Single file, JSON)..."
          className="bg-background min-h-14 font-mono text-xs resize-y"
        />
      </div>

      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">💡 Samples :</label>
        <Textarea
          value={promptFields.samples}
          onChange={(e) => updatePromptFields({ samples: e.target.value })}
          placeholder="Provide reference examples or code snippets..."
          className="bg-background min-h-16 font-mono text-xs resize-y"
        />
      </div>
    </div>
  );

  const bottomContent = (
    <div className="space-y-2 bg-background pt-2 border-border border-t w-full">
      <div className="flex items-center gap-3 bg-card p-2.5 border border-border rounded-lg w-full">
        <div className="flex-1 space-y-1 min-w-0">
          <label className="block font-bold text-[10px] text-muted-foreground uppercase">
            TEMPLATE
          </label>
          <Select
            value={selectedTemplateId}
            onValueChange={(val) => val && setSelectedTemplateId(val)}
          >
            <SelectTrigger className="bg-background py-0 w-full h-8 text-xs">
              <SelectValue placeholder="Select a prompt template..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_PROMPTS.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleCopyPrompt}
          className="flex justify-center items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 shadow-sm mt-4 rounded-lg w-36 h-8 font-bold text-white text-xs whitespace-nowrap cursor-pointer shrink-0"
        >
          <Copy size={14} /> Copy prompt
        </Button>
      </div>

      <FilesCtxExportPanel handleCopy={handleCopy} />
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="prompt-panel"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
      className="h-full font-mono text-xs animate-in duration-200 fade-in"
    />
  );
}

import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Monitor, Sparkles, Wrench } from 'lucide-react';

export type PromptType = 'refacto' | 'new-feature' | 'improve' | 'technical' | 'business';

export const LLMOptimiser: React.FC = () => {
  const [workflow, setWorkflow] = useState<string>('default');
  const [promptType, setPromptType] = useState<PromptType>('improve');
  const [useCaveman, setUseCaveman] = useState<boolean>(false);
  const [useRtk, setUseRtk] = useState<boolean>(true);

  // Detected machine configuration
  const machineConfig = {
    os: 'macOS (ARM64)',
    cpu: 'Apple M-Series (10 Cores)',
    ram: '32 GB',
    vram: '16 GB Unified',
  };

  // AI recommendation
  const aiRecommendation = {
    provider: 'Ollama / Gemini',
    model: 'qwen2.5-coder:1.5b / gemini-2.5-pro',
  };

  return (
    <div className="flex flex-col gap-2.5 bg-card/60 p-2.5 border border-border/80 rounded-md font-mono text-xs">
      {/* Workflow & Prompt Type Selects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold shrink-0 text-muted-foreground">Workflow:</span>
          <Select value={workflow} onValueChange={(val) => val && setWorkflow(val)}>
            <SelectTrigger className="h-7 text-xs w-60 font-mono bg-background">
              <SelectValue placeholder="Select Workflow..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">⚡ Standard Generation</SelectItem>
              <SelectItem value="code-review">🔍 Deep Code Review</SelectItem>
              <SelectItem value="bugfix">🐛 Bug Diagnosis & Fix</SelectItem>
              <SelectItem value="architecture">🏗️ Architecture Design</SelectItem>
              <SelectItem value="unit-test">🧪 Test Suite Generation</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bold shrink-0 text-muted-foreground">Prompt Type:</span>
          <Select value={promptType} onValueChange={(val) => val && setPromptType(val as PromptType)}>
            <SelectTrigger className="h-7 text-xs w-60 font-mono bg-background">
              <SelectValue placeholder="Select Type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="refacto">♻️ Refacto</SelectItem>
              <SelectItem value="new-feature">✨ New Feature</SelectItem>
              <SelectItem value="improve">🚀 Improve</SelectItem>
              <SelectItem value="technical">🛠️ Technical</SelectItem>
              <SelectItem value="business">💼 Business</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tools Checkboxes */}
      <div className="flex items-center gap-4 py-1 px-2 bg-muted/20 border border-border/50 rounded">
        <div className="flex items-center gap-1.5 font-bold text-foreground shrink-0">
          <Wrench size={13} className="text-primary" />
          <span>Use Tools:</span>
        </div>
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <Checkbox
            checked={useCaveman}
            onCheckedChange={(chk) => setUseCaveman(Boolean(chk))}
          />
          <span>Caveman</span>
        </label>
        <label className="flex items-center gap-1.5 cursor-pointer select-none text-muted-foreground hover:text-foreground">
          <Checkbox
            checked={useRtk}
            onCheckedChange={(chk) => setUseRtk(Boolean(chk))}
          />
          <span>RTK</span>
        </label>
      </div>

      {/* Machine Config & AI Recommendation Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
        {/* Machine Config */}
        <div className="flex flex-col gap-1 p-2 bg-background/50 border border-border/60 rounded">
          <div className="flex items-center gap-1.5 font-bold text-muted-foreground">
            <Monitor size={12} className="text-indigo-400" />
            <span>Detected Machine Configuration</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[10px]">
            <div><span className="text-muted-foreground">OS:</span> {machineConfig.os}</div>
            <div><span className="text-muted-foreground">CPU:</span> {machineConfig.cpu}</div>
            <div><span className="text-muted-foreground">RAM:</span> {machineConfig.ram}</div>
            <div><span className="text-muted-foreground">VRAM:</span> {machineConfig.vram}</div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="flex flex-col gap-1 p-2 bg-background/50 border border-border/60 rounded">
          <div className="flex items-center gap-1.5 font-bold text-amber-500 dark:text-amber-400">
            <Sparkles size={12} />
            <span>AI Recommendation</span>
          </div>
          <div className="flex flex-col gap-0.5 font-mono text-[10px]">
            <div><span className="text-muted-foreground">Provider:</span> {aiRecommendation.provider}</div>
            <div><span className="text-muted-foreground">Model:</span> {aiRecommendation.model}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMOptimiser;

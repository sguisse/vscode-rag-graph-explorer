import React from 'react';
import { Copy, Bot, User, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useGraphRagExplorerStore } from './graph-rag-explorer-store';

const PREDEFINED_PROMPTS_JSON = [
  {
    id: 'refactor',
    name: '⚡ Code Refactoring & Optimization',
    data: {
      mode: 'role' as const,
      roleOrAgent: 'Senior Clean Code Architect',
      selectedAgent: 'CodeRefactoringAgent',
      tone: 'Surgical, concise, zero fluff',
      context: 'Refactoring large legacy component functions into clean modular handlers.',
      expected: 'Refactored code with improved readability and lower complexity.',
      output: 'Complete TypeScript/React code without placeholders.',
      samples: 'const handleAction = useCallback(() => { ... }, []);',
    },
  },
  {
    id: 'security',
    name: '🛡️ Security & Vulnerability Audit',
    data: {
      mode: 'agent' as const,
      roleOrAgent: 'AppSec Audit Specialist',
      selectedAgent: 'SecurityAuditAgent',
      tone: 'Strict, diagnostic, analytical',
      context: 'Reviewing API handlers and data transformers for secret leaks or injection risks.',
      expected: 'List of detected risks with patched code snippets.',
      output: 'Structured markdown report followed by fixed source code.',
      samples: 'Avoid hardcoded credentials and unsafe regex evaluations.',
    },
  },
  {
    id: 'tests',
    name: '🧪 Unit & Integration Test Generation',
    data: {
      mode: 'role' as const,
      roleOrAgent: 'QA & Test Engineering Specialist',
      selectedAgent: 'TestGeneratorAgent',
      tone: 'Methodical, thorough, precise',
      context: 'Writing full test suites for state stores and UI components.',
      expected: '100% code coverage including edge cases and error states.',
      output: 'Vitest / Jest test file code.',
      samples: 'describe("StateStore", () => { it("should update state", () => { ... }); });',
    },
  },
];

const AGENTS_LIST = [
  'CodeRefactoringAgent',
  'SecurityAuditAgent',
  'ASTGraphAgent',
  'TestGeneratorAgent',
  'DocumentationAgent',
];

interface PromptPanelProps {
  handleCopy?: (text: string, message: string) => void;
}

export function PromptPanel({ handleCopy }: PromptPanelProps) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const { promptFields, updatePromptFields, getFullPrompt, resetPromptFields } = useGraphRagExplorerStore();

  const notify = (msg: string) => {
    if (handleCopy) {
      handleCopy('', msg);
    } else {
      setNotification(msg);
    }
  };

  const handlePredefinedChange = (presetId: string) => {
    const found = PREDEFINED_PROMPTS_JSON.find((p) => p.id === presetId);
    if (found) {
      updatePromptFields({ ...found.data, predefined: presetId });
      notify(`Loaded predefined template: ${found.name}`);
    } else {
      updatePromptFields({ predefined: presetId });
    }
  };

  const handleCopyPrompt = () => {
    const fullPrompt = getFullPrompt();
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fullPrompt);
    }
    notify('✅ Full prompt copied to clipboard!');
  };

  const handleCopyFilesCtx = () => {
    notify('📋 Files context snapshot copied to clipboard!');
  };

  const handleInsertAgent = () => {
    updatePromptFields({ roleOrAgent: `${promptFields.selectedAgent}: ${promptFields.roleOrAgent}` });
    notify(`Inserted agent ${promptFields.selectedAgent} into field!`);
  };

  return (
    <div className="space-y-3 font-mono text-xs animate-in duration-200 fade-in">
      {/* Predefined Prompt Dropdown */}
      <div className="space-y-1 bg-muted/20 p-2.5 border border-border rounded-lg">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">
          Predefined :
        </label>
        <Select
          value={promptFields.predefined}
          onValueChange={(val) => val && handlePredefinedChange(val)}
        >
          <SelectTrigger className="bg-background h-8 text-xs">
            <SelectValue placeholder="Select a predefined prompt template..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="custom">✍️ Custom Prompt</SelectItem>
            {PREDEFINED_PROMPTS_JSON.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Role / Agent Toggle & Field */}
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
              <User size={12} className="text-primary" /> Rôle
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
              <SelectTrigger className="bg-background h-7 text-xs flex-1">
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

        <Input
          value={promptFields.roleOrAgent}
          onChange={(e) => updatePromptFields({ roleOrAgent: e.target.value })}
          placeholder={promptFields.mode === 'agent' ? 'Specify Agent role description...' : 'Specify Role title...'}
          className="bg-background h-8 text-xs font-semibold"
        />
      </div>

      {/* Tone Field */}
      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">tone :</label>
        <Textarea
          value={promptFields.tone}
          onChange={(e) => updatePromptFields({ tone: e.target.value })}
          placeholder="Define communication tone and style..."
          className="bg-background min-h-14 text-xs font-mono resize-y"
        />
      </div>

      {/* Context Field */}
      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">context :</label>
        <Textarea
          value={promptFields.context}
          onChange={(e) => updatePromptFields({ context: e.target.value })}
          placeholder="Describe technical context and background..."
          className="bg-background min-h-16 text-xs font-mono resize-y"
        />
      </div>

      {/* Expected Field */}
      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Expected :</label>
        <Textarea
          value={promptFields.expected}
          onChange={(e) => updatePromptFields({ expected: e.target.value })}
          placeholder="Specify expected deliverables and constraints..."
          className="bg-background min-h-16 text-xs font-mono resize-y"
        />
      </div>

      {/* Output Field */}
      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Output :</label>
        <Textarea
          value={promptFields.output}
          onChange={(e) => updatePromptFields({ output: e.target.value })}
          placeholder="Format requirements (e.g., Markdown, Single file, JSON)..."
          className="bg-background min-h-14 text-xs font-mono resize-y"
        />
      </div>

      {/* Samples Field */}
      <div className="space-y-1">
        <label className="block font-bold text-[10px] text-muted-foreground uppercase">Samples :</label>
        <Textarea
          value={promptFields.samples}
          onChange={(e) => updatePromptFields({ samples: e.target.value })}
          placeholder="Provide reference examples or code snippets..."
          className="bg-background min-h-16 text-xs font-mono resize-y"
        />
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
        <Button
          onClick={handleCopyFilesCtx}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-9 text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <FileText size={14} /> Copy files ctx
        </Button>
        <Button
          onClick={handleCopyPrompt}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Copy size={14} /> Copy prompt
        </Button>
      </div>

      <div className="flex justify-end pt-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            resetPromptFields();
            notify('Reset prompt fields to default values');
          }}
          className="h-6 text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <RefreshCw size={10} className="mr-1" /> Reset Form
        </Button>
      </div>
    </div>
  );
}

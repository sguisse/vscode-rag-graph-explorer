import React, { useState } from 'react';
import { Cpu, Send, Copy, Sparkles, Play, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useGraphRagExplorerStore } from './graph-rag-explorer-store';

const CLIENT_PROVIDERS = [
  { id: 'Ollama', label: '🦙 Ollama (Local)', models: ['llama3:latest', 'qwen2.5-coder:14b', 'mistral-nemo', 'codellama'] },
  { id: 'Copilot', label: '✈️ GitHub Copilot', models: ['gpt-4o', 'claude-3-5-sonnet', 'o3-mini'] },
  { id: 'Claude', label: '🧠 Anthropic Claude', models: ['claude-3-5-sonnet-20241022', 'claude-3-haiku'] },
  { id: 'OpenAI', label: '🤖 OpenAI API', models: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'] },
  { id: 'Gemini', label: '✨ Google Gemini', models: ['gemini-1.5-pro', 'gemini-1.5-flash'] },
];

interface LLMPanelProps {
  handleCopy?: (text: string, message: string) => void;
}

export function LLMPanel({ handleCopy }: LLMPanelProps) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const { config, getFullPrompt } = useGraphRagExplorerStore();

  const [selectedClient, setSelectedClient] = useState(config.defaultClient || 'Ollama');
  const [selectedModel, setSelectedModel] = useState(config.defaultModel || 'llama3:latest');
  const [actionMode, setActionMode] = useState<'ask' | 'apply'>('ask');
  const [isLoading, setIsLoading] = useState(false);
  const [llmResult, setLlmResult] = useState<string | null>(null);

  const currentProvider = CLIENT_PROVIDERS.find((p) => p.id === selectedClient) || CLIENT_PROVIDERS[0];

  const notify = (msg: string) => {
    if (handleCopy) {
      handleCopy('', msg);
    } else {
      setNotification(msg);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClient(clientId);
    const provider = CLIENT_PROVIDERS.find((p) => p.id === clientId);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0]);
    }
    notify(`Client provider switched to ${clientId}`);
  };

  const handleRunLLM = () => {
    setIsLoading(true);
    notify(`🚀 Dispatching request to ${selectedClient} (${selectedModel})...`);

    setTimeout(() => {
      setIsLoading(false);
      const assembledPrompt = getFullPrompt();
      const mockResponse = `// --- Generated response from ${selectedClient} [Model: ${selectedModel}] ---
// Mode: ${actionMode === 'apply' ? 'Apply on Codebase' : 'Ask Question'}

export function executeGeneratedPipeline() {
  console.log("Context processed successfully.");
  return { status: 200, mode: "${actionMode}" };
}

/* Prompt payload excerpt: */
${assembledPrompt.slice(0, 150)}...`;

      setLlmResult(mockResponse);
      notify(`✅ Response received from ${selectedClient}!`);
    }, 1200);
  };

  const handleCopyResult = () => {
    if (llmResult && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(llmResult);
    }
    notify('📋 Result content copied to clipboard!');
  };

  const handleApplyCodebase = () => {
    notify(`⚡ Applied generated response onto target codebase files!`);
  };

  return (
    <div className="space-y-3 font-mono text-xs animate-in duration-200 fade-in">
      {/* Header Configuration */}
      <div className="bg-card p-3 border border-border rounded-lg space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground uppercase text-xs">
            <Cpu size={14} className="text-primary" /> Select LLM Engine
          </span>
          <span className="bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded text-[10px] text-emerald-500 font-bold">
            Connected
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] text-muted-foreground uppercase font-bold">Provider / Client :</label>
            <Select value={selectedClient} onValueChange={(val) => val && handleClientChange(val)}>
              <SelectTrigger className="bg-background h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_PROVIDERS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] text-muted-foreground uppercase font-bold">Model Target :</label>
            <Select
              value={selectedModel}
              onValueChange={(val) => {
                if (val) {
                  setSelectedModel(val);
                  notify(`Model set to ${val}`);
                }
              }}
            >
              <SelectTrigger className="bg-background h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currentProvider.models.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Trigger Button */}
      <Button
        onClick={handleRunLLM}
        disabled={isLoading}
        className="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md gap-2 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Sparkles size={16} className="animate-spin" /> Processing LLM Context...
          </>
        ) : (
          <>
            <Send size={16} /> Execute LLM Query ({selectedClient})
          </>
        )}
      </Button>

      {/* Result Card */}
      {llmResult && (
        <Card className="bg-card border-border shadow-md overflow-hidden animate-in duration-200 fade-in">
          <CardHeader className="bg-muted/40 p-3 border-b border-border/60">
            <div className="flex justify-between items-center">
              <CardTitle className="font-bold text-xs uppercase flex items-center gap-1.5 text-foreground">
                <Terminal size={14} className="text-emerald-500" /> LLM Generation Output
              </CardTitle>
              <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {selectedModel}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-3 space-y-3">
            <Textarea
              readOnly
              value={llmResult}
              className="bg-slate-950 text-slate-200 font-mono text-[11px] h-36 border-slate-800 resize-none"
            />

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
              <div className="flex items-center gap-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">ask:</label>
                <Select
                  value={actionMode}
                  onValueChange={(val) => {
                    if (val === 'ask' || val === 'apply') {
                      setActionMode(val);
                    }
                  }}
                >
                  <SelectTrigger className="bg-background h-7 text-xs w-36 font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ask">💬 ask</SelectItem>
                    <SelectItem value="apply">⚡ apply on codebase</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-1.5">
                {actionMode === 'apply' && (
                  <Button
                    size="sm"
                    onClick={handleApplyCodebase}
                    className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1 cursor-pointer"
                  >
                    <Play size={12} /> Apply Changes
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyResult}
                  className="h-7 text-xs gap-1 font-semibold cursor-pointer"
                >
                  <Copy size={12} /> Copy
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

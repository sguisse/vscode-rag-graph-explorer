import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { X, Info, Send, Copy, Check, Zap } from 'lucide-react';
import { LlmProvider, ILlmModelInfo } from '@/shared/services/llm-chat';
import { useLlmChat } from '@/features/sdlc/domains/llm-chat/hooks/use-llm-chat';
import { computeCostRating } from '@/features/sdlc/domains/llm-chat/hooks/use-llm-models-info';
import { useLlmModelsInfoModal } from '@/features/sdlc/domains/llm-chat/hooks/use-llm-models-info-modal';
import { LLMModelsInfoModal } from './llm-models-info-modal';
import { LLMOptimiser } from './llm-optimiser';

export const LLMChat: React.FC = () => {
  const {
    provider,
    setProvider,
    models,
    selectedModel,
    setSelectedModel,
    inputPrompt,
    setInputPrompt,
    temperature,
    setTemperature,
    attachedFiles,
    isLoading,
    handleRemoveFileContext,
    handleSend,
  } = useLlmChat();

  const { isOpen: isModalOpen, openModal, closeModal } = useLlmModelsInfoModal();
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Filter models to only display state === 'enabled' (or undefined/unrestricted state)
  const enabledModels = useMemo(() => {
    return models.filter((m) => !m.policy?.state || m.policy.state.toLowerCase() === 'enabled');
  }, [models]);

  const handleCopyRequest = () => {
    if (!inputPrompt) return;
    navigator.clipboard.writeText(inputPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  /**
   * Helper to format model specifications in small text in parenthesis:
   * (max input tokens, cost level [1-5], tools, vision, thinking, effort, streaming)
   */
  const renderModelSpecsBadge = (m: ILlmModelInfo) => {
    const cost = computeCostRating(m);
    const limits = m.capabilities?.limits;
    const supports = m.capabilities?.supports;

    const maxInput = limits?.max_prompt_tokens ?? limits?.max_context_window_tokens ?? m.contextWindow;
    const maxInputText = maxInput
      ? maxInput >= 1000000
        ? `${(maxInput / 1000000).toFixed(1)}M in`
        : `${Math.round(maxInput / 1000)}k in`
      : null;

    const specs: string[] = [];
    if (maxInputText) specs.push(maxInputText);
    specs.push(`cost: ${cost}/5`);

    if (supports?.tool_calls || supports?.parallel_tool_calls) specs.push('tools');
    if (supports?.vision) specs.push('vision');
    if (supports?.adaptive_thinking || supports?.max_thinking_budget) specs.push('thinking');
    if (
      (m.supportedReasoningEfforts && m.supportedReasoningEfforts.length > 0) ||
      (supports?.reasoning_effort && supports.reasoning_effort.length > 0)
    ) {
      specs.push('effort');
    }
    if (supports?.streaming) specs.push('streaming');

    return `(${specs.join(', ')})`;
  };

  return (
    <div className="relative flex flex-col gap-2.5 bg-background p-2.5 w-full h-full min-h-0 overflow-y-auto font-sans text-foreground">
      {/* Collapsible LLM Workflow Optimiser */}
      <CollapsibleCard
        title={
          <div className="flex items-center gap-1.5">
            <Zap size={13} className="text-amber-400" />
            <span className="font-bold text-xs uppercase">LLM Prompt & Workflow Optimiser</span>
          </div>
        }
        defaultExpanded={true}
        contentToCopy=""
        className="bg-card border-border shrink-0"
      >
        <LLMOptimiser />
      </CollapsibleCard>

      {/* Top Model Controls */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-card border border-border rounded-md text-xs shrink-0">
        <span className="font-bold">Provider:</span>
        <Select
          value={provider}
          onValueChange={(val) => val && setProvider(val as LlmProvider)}
        >
          <SelectTrigger className="w-28 h-7 font-mono text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={LlmProvider.OLLAMA}>🦙 Ollama</SelectItem>
            <SelectItem value={LlmProvider.GEMINI}>♊ Gemini</SelectItem>
            <SelectItem value={LlmProvider.COPILOT}>✈️ Copilot</SelectItem>
          </SelectContent>
        </Select>

        <span className="ml-1 font-bold">Model:</span>
        <Select
          value={selectedModel}
          onValueChange={(val) => val && setSelectedModel(val)}
        >
          <SelectTrigger className="flex-1 max-w-[450px] h-7 font-mono text-xs">
            <SelectValue placeholder="Select model..." />
          </SelectTrigger>
          <SelectContent className="max-w-[550px] z-[10000]">
            {enabledModels.map((m) => {
              const isCustomModel = m.capabilities?.family === 'custom' || m.modelPickerCategory === 'custom';
              return (
                <SelectItem key={m.id} value={m.id}>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs truncate">
                    <span className={isCustomModel ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium'}>
                      {m.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-normal">
                      {renderModelSpecsBadge(m)}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        <span className="ml-1 font-medium">Temp ({temperature}):</span>
        <Input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="bg-transparent p-0 border-0 w-16 h-5 cursor-pointer"
        />

        <div className="flex items-center ml-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={openModal}
            className="hover:bg-primary/10 border-border w-7 h-7 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            data-tooltip="View Model Capabilities & Info"
          >
            <Info size={14} />
          </Button>
        </div>
      </div>

      {/* Context Files Attachment Section */}
      {attachedFiles.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-card/60 border border-border rounded-md">
          <span className="opacity-80 font-bold text-[11px]">Attached File Context:</span>
          {attachedFiles.map((file) => (
            <span
              key={file.path}
              className="inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 border border-primary/20 rounded-full font-mono text-[10px] text-primary"
            >
              📄 {file.path}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveFileContext(file.path)}
                data-tooltip="Remove file context"
                className="hover:bg-transparent p-0 w-3.5 h-3.5 text-primary hover:text-destructive"
              >
                <X size={10} />
              </Button>
            </span>
          ))}
        </div>
      )}

      {/* Prompt Instruction Textarea & Action Buttons */}
      <div className="flex flex-col flex-1 gap-2 min-h-[120px]">
        <Textarea
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Type your instruction for LLM..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 bg-background p-2.5 min-h-[100px] font-mono text-xs resize-y"
        />
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="outline"
            onClick={handleCopyRequest}
            disabled={!inputPrompt.trim()}
            className="gap-1.5 font-bold text-xs cursor-pointer"
          >
            {isCopied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {isCopied ? 'Copied!' : 'Copy Request'}
          </Button>
          <Button
            variant="default"
            onClick={handleSend}
            disabled={isLoading || !inputPrompt.trim()}
            className="gap-1.5 font-bold text-xs cursor-pointer"
          >
            <Send size={13} />
            {isLoading ? 'Thinking...' : 'Send Request'}
          </Button>
        </div>
      </div>

      {/* Non-Modal Models Metadata Info Popup */}
      <LLMModelsInfoModal
        isOpen={isModalOpen}
        onClose={closeModal}
        currentProvider={provider}
        onSelectModel={(prov, modelId) => {
          setProvider(prov);
          setSelectedModel(modelId);
        }}
      />
    </div>
  );
};

export default LLMChat;

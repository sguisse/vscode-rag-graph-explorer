import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsDown, ChevronsUp, ArrowUp, ArrowDown, X, Plus, Info } from 'lucide-react';
import { LlmProvider } from '@/shared/services/llm-chat';
import { useLlmChat } from '../hooks/use-llm-chat';
import { useLlmModelsInfoModal } from '../hooks/use-llm-models-info-modal';
import { UserMessageBlock } from './components/UserMessageBlock';
import { AssistantMessageBlock } from './components/AssistantMessageBlock';
import { LLMModelsInfoModal } from './llm-models-info-modal';

export const LLMChat: React.FC = () => {
  const {
    provider,
    setProvider,
    models,
    selectedModel,
    setSelectedModel,
    messages,
    inputPrompt,
    setInputPrompt,
    temperature,
    setTemperature,
    attachedFiles,
    filePathInput,
    setFilePathInput,
    isReadingFile,
    isLoading,
    globalExpanded,
    scrollContainerRef,
    messagesEndRef,
    handleAddFileContext,
    handleRemoveFileContext,
    handleSend,
    handleScrollToTop,
    handleScrollToBottom,
    handleExpandAll,
    handleCollapseAll,
  } = useLlmChat();

  const { isOpen: isModalOpen, openModal, closeModal } = useLlmModelsInfoModal();

  return (
    <div className="relative flex flex-col gap-2.5 bg-background p-0 w-full h-full min-h-0 overflow-hidden font-sans text-foreground">
      {/* Standard Panel Top Toolbar */}
      <div className="flex justify-between items-center bg-muted/20 px-1 border-border border-b font-mono text-xs shrink-0">
        <div className="flex items-center gap-1">
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleExpandAll}
            data-tooltip="Expand All Message Panels"
          >
            <ChevronsDown size={13} />
          </Button>
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleCollapseAll}
            data-tooltip="Collapse All Message Panels"
          >
            <ChevronsUp size={13} />
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleScrollToTop}
            data-tooltip="Scroll to Top"
          >
            <ArrowUp size={13} />
          </Button>
          <Button
            className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleScrollToBottom}
            data-tooltip="Scroll to Bottom"
          >
            <ArrowDown size={13} />
          </Button>
        </div>
      </div>

      {/* Message History */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col flex-1 gap-2.5 p-2 min-h-0 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="opacity-60 mt-8 font-mono text-xs text-center italic">
            No conversation started. Attach files as context and type your instruction below.
          </div>
        ) : (
          messages.map((msg) =>
            msg.role === 'user' ? (
              <UserMessageBlock
                key={msg.id}
                msg={msg}
                globalExpanded={globalExpanded}
              />
            ) : (
              <AssistantMessageBlock
                key={msg.id}
                msg={msg}
                fallbackProvider={provider}
                fallbackModel={selectedModel}
                globalExpanded={globalExpanded}
              />
            )
          )
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer Controls */}
      <footer className="flex flex-col gap-2 p-2 pt-2 border-border border-t text-xs shrink-0">
        <div className="flex flex-wrap items-center gap-2 pb-2 border-border border-b text-xs shrink-0">
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
            <SelectTrigger className="flex-1 max-w-[150px] h-7 font-mono text-xs">
              <SelectValue placeholder="Select model..." />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name}
                </SelectItem>
              ))}
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

          {/* Tool icon for toggling model info popup */}
          <div className="ml-auto flex items-center">
            <Button
              variant="outline"
              size="icon"
              onClick={openModal}
              className="w-7 h-7 hover:bg-primary/10 border-border text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              data-tooltip="View Model Capabilities & Info"
            >
              <Info size={14} />
            </Button>
          </div>
        </div>

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="opacity-80 font-bold text-[11px]">Context Files:</span>
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

        <div className="flex items-center gap-2">
          <Input
            type="text"
            value={filePathInput}
            onChange={(e) => setFilePathInput(e.target.value)}
            placeholder="Add file path as context (e.g. src/services/user.service.ts)..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddFileContext();
              }
            }}
            className="flex-1 h-8 font-mono text-xs"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAddFileContext}
            disabled={isReadingFile || !filePathInput.trim()}
            className="gap-1 h-8 font-mono text-xs cursor-pointer"
          >
            <Plus size={12} />
            {isReadingFile ? 'Reading...' : 'Add Context'}
          </Button>
        </div>

        <div className="flex gap-2">
          <Textarea
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Type your instruction for LLM..."
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="flex-1 min-h-[50px] font-mono text-xs resize-none"
          />
          <Button
            variant="default"
            onClick={handleSend}
            disabled={isLoading}
            className="h-auto font-bold text-xs cursor-pointer"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </Button>
        </div>
      </footer>

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

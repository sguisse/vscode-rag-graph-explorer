#!/usr/bin/env bash
set -e

echo "🎨 Fixing card header top corner rounding artifact in LLM.tsx..."

mkdir -p webview/src/features/explorer/sdb-rgt-prompt

cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/LLM.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronsDown, ChevronsUp, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LlmProvider,
  IChatMessageDto,
} from '@/shared/services/llm-chat';
import {
  useLlmChat,
  formatExecutionTime,
  formatDateTime,
  formatTokenCount,
  parseUserMessageContent,
} from './hooks/use-llm-chat';

const CopyButton: React.FC<{ text: string; title?: string }> = ({ text, title = 'Copy content' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.log('Failed to copy text', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={title}
      className="inline-flex justify-center items-center opacity-85 hover:opacity-100 p-0.5 rounded-sm text-xs transition-opacity cursor-pointer"
    >
      {copied ? '✅' : '📋'}
    </button>
  );
};

interface CollapsibleCardProps {
  title: React.ReactNode;
  badge?: string;
  defaultExpanded?: boolean;
  globalExpanded?: { value: boolean; id: number };
  contentToCopy: string;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  footer?: React.ReactNode;
  footerStyle?: React.CSSProperties;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  badge,
  defaultExpanded = true,
  globalExpanded,
  contentToCopy,
  children,
  className,
  style,
  headerClassName,
  headerStyle,
  footer,
  footerStyle,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (globalExpanded !== undefined) {
      setIsOpen(globalExpanded.value);
    }
  }, [globalExpanded?.id]);

  return (
    <Card
      className={cn("flex flex-col py-0 border rounded-sm overflow-hidden shrink-0", className)}
      style={style}
    >
      {/* Header fills top corners completely and is clipped by Card's overflow-hidden */}
      <CardHeader
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn("flex flex-row justify-between items-center space-y-0 p-0.5 px-3 rounded-t-none transition-colors cursor-pointer select-none", headerClassName)}
        style={headerStyle}
      >
        <div className="flex items-center gap-1.5 font-bold text-xs">
          <span className="text-[10px]">{isOpen ? '▼' : '►'}</span>
          {typeof title === 'string' ? <span>{title}</span> : title}
          {badge && (
            <span className="bg-primary/10 px-1.5 py-0.2 rounded-sm font-semibold text-[9px] text-primary">
              {badge}
            </span>
          )}
        </div>

        <CopyButton text={contentToCopy} title="Copy block content" />
      </CardHeader>

      {/* Sub-Card / Block Body */}
      {isOpen && children && (
        <CardContent className="p-2 px-2.5 font-mono text-[11px] break-words leading-relaxed whitespace-pre-wrap">
          {children}
        </CardContent>
      )}

      {/* Footer Metadata */}
      {footer && (
        <CardFooter
          className="justify-end opacity-70 p-1 px-2.5 text-[10px] italic"
          style={footerStyle}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
};

const UserMessageBlock: React.FC<{
  msg: IChatMessageDto;
  globalExpanded?: { value: boolean; id: number };
}> = ({ msg, globalExpanded }) => {
  const { contextText, instructionText } = parseUserMessageContent(msg.content);

  const userBg = 'color-mix(in srgb, var(--blue-1, #1e293b) 30%, var(--card))';
  const userBgHeader = 'color-mix(in srgb, var(--blue-1, #1e293b) 60%, var(--card))';
  const userBorder = 'color-mix(in srgb, var(--blue-2, #38bdf8) 40%, var(--border))';

  const subCardBg = 'color-mix(in srgb, var(--white, #ffffff) 15%, var(--card))';
  const subCardHeader = 'color-mix(in srgb, var(--gray-1, #1e293b) 35%, var(--card))';
  const subCardBorder = 'color-mix(in srgb, var(--gray-2, #475569) 30%, var(--border))';

  return (
    <CollapsibleCard
      title={
        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 text-xs">
          👤 USER REQUEST
        </span>
      }
      defaultExpanded={true}
      globalExpanded={globalExpanded}
      contentToCopy={msg.content}
      className="self-end w-full max-w-[90%]"
      style={{
        backgroundColor: userBg,
        borderColor: userBorder,
        color: 'var(--foreground)'
      }}
      headerStyle={{
        backgroundColor: userBgHeader,
        borderBottom: `1px solid ${userBorder}`,
      }}
      footerStyle={{
        borderTop: `1px dashed ${userBorder}`,
      }}
      footer={`${formatDateTime(msg.timestamp)} | Context Files: ${msg.fileCount ?? 0}`}
    >
      <div className="flex flex-col gap-1.5">
        {contextText && (
          <CollapsibleCard
            title="📄 Attached File Context"
            badge={msg.fileCount ? `${msg.fileCount} files` : 'xml'}
            defaultExpanded={false}
            globalExpanded={globalExpanded}
            contentToCopy={contextText}
            style={{
              backgroundColor: subCardBg,
              borderColor: subCardBorder,
            }}
            headerStyle={{
              backgroundColor: subCardHeader,
              borderBottom: `1px solid ${subCardBorder}`,
            }}
          >
            {contextText}
          </CollapsibleCard>
        )}

        <CollapsibleCard
          title="💬 Instruction Prompt"
          defaultExpanded={true}
          globalExpanded={globalExpanded}
          contentToCopy={instructionText}
          style={{
            backgroundColor: subCardBg,
            borderColor: subCardBorder,
          }}
          headerStyle={{
            backgroundColor: subCardHeader,
            borderBottom: `1px solid ${subCardBorder}`,
          }}
        >
          {instructionText}
        </CollapsibleCard>
      </div>
    </CollapsibleCard>
  );
};

const AssistantMessageBlock: React.FC<{
  msg: IChatMessageDto;
  fallbackProvider: LlmProvider;
  fallbackModel: string;
  globalExpanded?: { value: boolean; id: number };
}> = ({ msg, fallbackProvider, fallbackModel, globalExpanded }) => {
  const assistantBg = 'color-mix(in srgb, var(--yellow-0, #451a03) 30%, var(--card))';
  const assistantBgHeader = 'color-mix(in srgb, var(--yellow-0, #451a03) 60%, var(--card))';
  const assistantBorder = 'color-mix(in srgb, var(--yellow-1, #eab308) 40%, var(--border))';

  const showFooter = msg.promptTokens !== undefined || msg.executionTimeMs !== undefined;

  return (
    <CollapsibleCard
      title={
        <span className="flex items-center gap-1.5 font-bold text-foreground text-xs">
          🤖 {(msg.provider || fallbackProvider).toUpperCase()} ({msg.model || fallbackModel})
        </span>
      }
      defaultExpanded={true}
      globalExpanded={globalExpanded}
      contentToCopy={msg.content}
      className="self-start w-full max-w-[85%]"
      style={{
        backgroundColor: assistantBg,
        borderColor: assistantBorder,
        color: 'var(--foreground)',
      }}
      headerStyle={{
        backgroundColor: assistantBgHeader,
        borderBottom: `1px solid ${assistantBorder}`,
      }}
      footerStyle={{
        borderTop: `1px dashed ${assistantBorder}`,
      }}
      footer={
        showFooter
          ? `In: ${formatTokenCount(msg.promptTokens)} tokens | Out: ${formatTokenCount(msg.completionTokens)} tokens | Time: ${formatExecutionTime(msg.executionTimeMs)}`
          : undefined
      }
    >
      <div className="font-sans text-xs break-words leading-relaxed whitespace-pre-wrap">
        {msg.content}
      </div>
    </CollapsibleCard>
  );
};

export const LLMExplorerChat: React.FC = () => {
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

  return (
    <div className="flex flex-col gap-3 bg-background p-3 w-full h-full min-h-0 overflow-hidden font-sans text-foreground">
      {/* Header controls */}
      <header className="flex flex-wrap items-center gap-2 pb-2 border-border border-b text-xs shrink-0">
        <label className="font-bold">Provider:</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProvider)}
          className="bg-input px-2 py-1 border border-border rounded-sm font-mono text-foreground text-xs"
        >
          <option value={LlmProvider.OLLAMA}>🦙 Ollama</option>
          <option value={LlmProvider.GEMINI}>♊ Gemini</option>
          <option value={LlmProvider.COPILOT}>✈️ Copilot</option>
        </select>

        <label className="ml-2 font-bold">Model:</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="bg-input px-2 py-1 border border-border rounded-sm font-mono text-foreground text-xs"
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label className="ml-2">Temp ({temperature}):</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-16"
        />
      </header>

      {/* Action Toolbar: Expand / Collapse All & Scroll to Top / Bottom */}
      <div className="flex justify-between items-center bg-muted/30 p-1 px-2 border border-border rounded-sm font-mono text-[11px] shrink-0">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 h-6 font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleExpandAll}
            title="Expand All Panels"
          >
            <ChevronsDown size={12} /> Expand All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 h-6 font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleCollapseAll}
            title="Collapse All Panels"
          >
            <ChevronsUp size={12} /> Collapse All
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 h-6 font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleScrollToTop}
            title="Scroll to Beginning"
          >
            <ArrowUp size={12} /> Top
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 px-2 h-6 font-mono text-[10px] text-muted-foreground hover:text-foreground cursor-pointer"
            onClick={handleScrollToBottom}
            title="Scroll to End"
          >
            <ArrowDown size={12} /> Bottom
          </Button>
        </div>
      </div>

      {/* Scrollable Message history */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col flex-1 gap-2.5 pr-1 min-h-0 overflow-y-auto"
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

      {/* Footer controls */}
      <footer className="flex flex-col gap-2 pt-2 border-border border-t text-xs shrink-0">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="opacity-80 font-bold text-[11px]">Context Files:</span>
            {attachedFiles.map((file) => (
              <span
                key={file.path}
                className="inline-flex items-center gap-1 bg-primary px-2 py-0.5 rounded-full font-mono text-[10px] text-primary-foreground"
              >
                📄 {file.path}
                <button
                  onClick={() => handleRemoveFileContext(file.path)}
                  title="Remove file context"
                  className="px-0.5 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
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
            className="flex-1 bg-input px-2 py-1 border border-border rounded-sm font-mono text-foreground text-xs"
          />
          <button
            onClick={handleAddFileContext}
            disabled={isReadingFile || !filePathInput.trim()}
            className="bg-secondary disabled:opacity-50 px-3 py-1 border border-border rounded-sm font-mono text-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isReadingFile ? 'Reading...' : '+ Add Context'}
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
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
            className="flex-1 bg-input p-1.5 border border-border rounded-sm font-mono text-xs resize-none"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-primary disabled:opacity-50 px-4 rounded-sm font-bold text-primary-foreground text-xs cursor-pointer disabled:cursor-not-allowed"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </footer>
    </div>
  );
};
EOF

if [ -f "package.json" ]; then
  npm run compile || true
fi

echo "✅ fix(llm): Removed CardHeader default rounded-t-xl by setting rounded-t-none on CardHeader inside overflow-hidden Card!"

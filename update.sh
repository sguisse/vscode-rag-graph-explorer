#!/usr/bin/env bash
set -e

echo "🚀 Externalizing UI state & logic into dedicated hooks and rationalizing layout containers..."

# Ensure directory structure exists
mkdir -p webview/src/features/explorer/sdb-rgt-prompt
mkdir -p webview/src/features/explorer/wkp-btm-infos
mkdir -p webview/src/features/explorer/wkp-lft-codebase-tree
mkdir -p webview/src/features/explorer/wkp-rgt-tabs-files-context
mkdir -p webview/src/features/explorer/wksp-cnt-graph
mkdir -p webview/src/features/explorer/layout-ctns

# ============================================================================
# 1. sdb-rgt-prompt hooks & components
# ============================================================================

# 1a. use-configuration.ts
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/use-configuration.ts
import { useAppContextStore } from '@/store/useAppContextStore';
import { useGraphRagExplorerStore } from './graph-rag-explorer-store';

export function useConfiguration() {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const { config, updateConfig } = useGraphRagExplorerStore();

  const handleSaveConfig = () => {
    setNotification(`✅ Configuration saved to local backend JSON: ${config.backendConfigPath}`);
  };

  return {
    config,
    updateConfig,
    handleSaveConfig,
  };
}
EOF

# 1b. configuration.tsx
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/configuration.tsx
import React from 'react';
import { Save, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useConfiguration } from './use-configuration';

export function ConfigurationPanel() {
  const { config, updateConfig, handleSaveConfig } = useConfiguration();

  return (
    <div className="space-y-3 font-mono text-xs animate-in duration-200 fade-in">
      {/* Header Title */}
      <div className="bg-muted/30 p-3 border border-border rounded-lg space-y-1">
        <div className="flex items-center gap-2">
          <Settings2 size={16} className="text-primary" />
          <h4 className="font-bold text-foreground text-xs uppercase">Explorer Global Settings</h4>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Persistent workspace settings stored in <code className="text-primary">{config.backendConfigPath}</code>
        </p>
      </div>

      {/* Form Settings */}
      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase">
            Backend JSON Config File Path :
          </label>
          <Input
            value={config.backendConfigPath}
            onChange={(e) => updateConfig({ backendConfigPath: e.target.value })}
            className="bg-background h-8 text-xs font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Default Client Provider :</label>
            <Input
              value={config.defaultClient}
              onChange={(e) => updateConfig({ defaultClient: e.target.value })}
              className="bg-background h-8 text-xs font-semibold"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Default Model Name :</label>
            <Input
              value={config.defaultModel}
              onChange={(e) => updateConfig({ defaultModel: e.target.value })}
              className="bg-background h-8 text-xs font-semibold"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Max Tokens Limit :</label>
            <Input
              type="number"
              value={config.maxTokens}
              onChange={(e) => updateConfig({ maxTokens: Number(e.target.value) || 4096 })}
              className="bg-background h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-muted-foreground uppercase">Temperature :</label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="1"
              value={config.temperature}
              onChange={(e) => updateConfig({ temperature: Number(e.target.value) || 0.2 })}
              className="bg-background h-8 text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-muted-foreground uppercase">System Prompt Prefix :</label>
          <Textarea
            value={config.systemPromptPrefix}
            onChange={(e) => updateConfig({ systemPromptPrefix: e.target.value })}
            className="bg-background h-16 text-xs resize-none font-mono"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-[11px] font-bold text-foreground">Save History Locally</span>
          <Switch
            checked={config.saveHistoryLocally}
            onCheckedChange={(checked) => updateConfig({ saveHistoryLocally: checked })}
          />
        </div>
      </div>

      {/* JSON Mock Preview */}
      <div className="space-y-1.5 bg-card p-3 border border-border rounded-lg">
        <span className="block font-bold text-[10px] text-muted-foreground uppercase">
          JSON Config Payload Mock Preview
        </span>
        <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-300 font-mono text-[10px] max-h-36 overflow-auto">
          {JSON.stringify(config, null, 2)}
        </pre>
      </div>

      {/* Save Action */}
      <Button
        onClick={handleSaveConfig}
        className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 cursor-pointer shadow-sm"
      >
        <Save size={14} /> Save Configuration (.token-razor/config/)
      </Button>
    </div>
  );
}
EOF

# 1c. use-llm-chat.ts
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/use-llm-chat.ts
import { useState, useEffect } from 'react';
import {
  LlmProvider,
  IChatMessageDto,
  ILlmModelInfo,
  IFileContextDto,
} from '../../../../../shared/services/llm-chat';
import { llmChatApiService } from '../../../services/api/llm-chat-api.service.gen';

const logInfo = (message: string, ...meta: any[]) => {
  console.log(`[LLMExplorerChat UI] ℹ️ ${message}`, meta.length ? meta : '');
};

export function formatExecutionTime(timeMs?: number): string {
  if (!timeMs || timeMs < 0) return '00m:00s';
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
}

export function formatDateTime(timestamp?: number): string {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
}

export function formatTokenCount(count?: number): string {
  if (count === undefined || count === null || isNaN(count) || count < 0) return '0';
  if (count > 999999) {
    return `${(count / 1000000).toFixed(1)} MB`;
  }
  if (count > 9999) {
    return `${(count / 1000).toFixed(1)} KB`;
  }
  if (count > 999) {
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }
  return count.toString();
}

export function formatPromptWithContext(instruction: string, files: IFileContextDto[]): string {
  if (!files || files.length === 0) {
    return instruction;
  }

  const fileBlocks = files
    .map((f) => `  <file path="${f.path}">\n${f.content || '// Content unavailable'}\n  </file>`)
    .join('\n');

  return `<context>\n${fileBlocks}\n</context>\n\n<instruction>\n  ${instruction}\n</instruction>`;
}

export function parseUserMessageContent(content: string) {
  const contextMatch = content.match(/<context>([\s\S]*?)<\/context>/);
  const instructionMatch = content.match(/<instruction>([\s\S]*?)<\/instruction>/);

  if (contextMatch || instructionMatch) {
    return {
      contextText: contextMatch ? contextMatch[0].trim() : null,
      instructionText: instructionMatch
        ? instructionMatch[1].trim()
        : content.replace(/<context>[\s\S]*?<\/context>/, '').trim(),
    };
  }

  return {
    contextText: null,
    instructionText: content,
  };
}

export function useLlmChat() {
  const [provider, setProvider] = useState<LlmProvider>(LlmProvider.OLLAMA);
  const [models, setModels] = useState<ILlmModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [messages, setMessages] = useState<IChatMessageDto[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [systemPrompt] = useState<string>('You are an expert Graph RAG Assistant.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);

  const [attachedFiles, setAttachedFiles] = useState<IFileContextDto[]>([]);
  const [filePathInput, setFilePathInput] = useState<string>('');
  const [isReadingFile, setIsReadingFile] = useState<boolean>(false);

  useEffect(() => {
    logInfo('Provider selection updated. Fetching models...', { provider });
    loadModels(provider);
  }, [provider]);

  const loadModels = async (prov: LlmProvider) => {
    try {
      const available = await llmChatApiService.listAvailableModels(prov);
      logInfo('Models loaded for provider', { provider: prov, count: available.length });
      setModels(available);
      if (available.length > 0) {
        setSelectedModel(available[0].id);
      } else {
        setSelectedModel('');
      }
    } catch (err: any) {
      logInfo('Failed to load models for provider', { provider: prov, error: err?.message });
      setModels([]);
    }
  };

  const handleAddFileContext = async () => {
    const trimmedPath = filePathInput.trim();
    if (!trimmedPath) return;

    if (attachedFiles.some((f) => f.path === trimmedPath)) {
      logInfo('File path already attached as context', { path: trimmedPath });
      setFilePathInput('');
      return;
    }

    setIsReadingFile(true);
    logInfo('Attaching file path context...', { path: trimmedPath });

    try {
      const content = await llmChatApiService.readFileContent(trimmedPath);
      setAttachedFiles((prev) => [...prev, { path: trimmedPath, content }]);
      logInfo('Successfully attached file content', { path: trimmedPath, chars: content.length });
    } catch (err: any) {
      logInfo('Error reading file content. Adding fallback entry.', { path: trimmedPath, error: err?.message });
      setAttachedFiles((prev) => [...prev, { path: trimmedPath, content: `// Unable to load ${trimmedPath}` }]);
    } finally {
      setFilePathInput('');
      setIsReadingFile(false);
    }
  };

  const handleRemoveFileContext = (pathToRemove: string) => {
    logInfo('Removing attached file context', { path: pathToRemove });
    setAttachedFiles((prev) => prev.filter((f) => f.path !== pathToRemove));
  };

  const handleSend = async () => {
    if (!inputPrompt.trim() || isLoading) return;

    const requestTimestamp = Date.now();
    const formattedPrompt = formatPromptWithContext(inputPrompt, attachedFiles);
    const contextFileCount = attachedFiles.length;

    logInfo('User submitted chat prompt with context', {
      provider,
      model: selectedModel,
      contextFilesCount: contextFileCount,
      rawPromptLength: inputPrompt.length,
      formattedPromptLength: formattedPrompt.length,
      timestamp: requestTimestamp,
    });

    const userMessage: IChatMessageDto = {
      id: `user-${requestTimestamp}`,
      role: 'user',
      content: formattedPrompt,
      timestamp: requestTimestamp,
      fileCount: contextFileCount,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await llmChatApiService.executeChat({
        provider,
        model: selectedModel,
        messages: newMessages,
        systemPrompt,
        fileContexts: attachedFiles,
        temperature,
      });

      if (response.error) {
        logInfo('Chat response received with error', { error: response.error });
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ Error: ${response.error}`,
            timestamp: Date.now(),
            provider: response.provider || provider,
            model: response.model || selectedModel,
          },
        ]);
      } else {
        logInfo('Chat response received successfully', {
          messageId: response.messageId,
          provider: response.provider,
          model: response.model,
          executionTimeMs: response.executionTimeMs,
          promptTokens: response.promptTokens,
          completionTokens: response.completionTokens,
        });
        setMessages((prev) => [
          ...prev,
          {
            id: response.messageId,
            role: 'assistant',
            content: response.content,
            timestamp: Date.now(),
            provider: response.provider || provider,
            model: response.model || selectedModel,
            promptTokens: response.promptTokens,
            completionTokens: response.completionTokens,
            totalTokens: response.totalTokens,
            executionTimeMs: response.executionTimeMs,
          },
        ]);
      }
    } catch (err: any) {
      logInfo('Chat request failed with exception', { error: err?.message });
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `❌ Communication Failure: ${err?.message || 'Unknown error'}`,
          timestamp: Date.now(),
          provider,
          model: selectedModel,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
    handleAddFileContext,
    handleRemoveFileContext,
    handleSend,
  };
}
EOF

# 1d. LLM.tsx
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/LLM.tsx
import React, { useState } from 'react';
import {
  LlmProvider,
  IChatMessageDto,
} from '../../../../../shared/services/llm-chat';
import {
  useLlmChat,
  formatExecutionTime,
  formatDateTime,
  formatTokenCount,
  parseUserMessageContent,
} from './use-llm-chat';

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
      style={{
        background: 'transparent',
        border: 'none',
        color: 'inherit',
        cursor: 'pointer',
        fontSize: '0.9em',
        padding: '2px 4px',
        borderRadius: '3px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.85,
        transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}
    >
      {copied ? '✅' : '📋'}
    </button>
  );
};

interface CollapsibleCardProps {
  title: string;
  badge?: string;
  defaultExpanded?: boolean;
  contentToCopy: string;
  children: React.ReactNode;
}

const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  badge,
  defaultExpanded = false,
  contentToCopy,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: '6px',
        backgroundColor: 'var(--card)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'var(--secondary)',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isOpen ? '1px solid var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8em', fontWeight: 'bold' }}>
          <span style={{ fontSize: '0.8em' }}>{isOpen ? '▼' : '►'}</span>
          <span>{title}</span>
          {badge && (
            <span
              style={{
                fontSize: '0.75em',
                fontWeight: 'normal',
                background: 'var(--primary)',
                color: 'var(--primary-foreground)',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              {badge}
            </span>
          )}
        </div>

        <CopyButton text={contentToCopy} title="Copy sub-block content" />
      </div>

      {isOpen && (
        <div
          style={{
            padding: '8px 10px',
            fontSize: '0.85em',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--font-mono)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const UserMessageBlock: React.FC<{ msg: IChatMessageDto }> = ({ msg }) => {
  const [isBlockExpanded, setIsBlockExpanded] = useState(true);
  const { contextText, instructionText } = parseUserMessageContent(msg.content);

  const userBg = 'var(--user-bg, var(--blue-0))';
  const userBorder = 'var(--user-border, var(--blue-2))';

  return (
    <div
      style={{
        alignSelf: 'flex-end',
        maxWidth: '90%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        backgroundColor: userBg,
        color: 'var(--foreground)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: `1px solid ${userBorder}`,
      }}
    >
      <div
        onClick={() => setIsBlockExpanded(!isBlockExpanded)}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: userBg,
          zIndex: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78em',
          fontWeight: 'bold',
          cursor: 'pointer',
          userSelect: 'none',
          paddingBottom: isBlockExpanded ? '4px' : '0px',
          borderBottom: isBlockExpanded ? `1px solid ${userBorder}` : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isBlockExpanded ? '▼' : '►'}</span>
          <span>👤 USER REQUEST</span>
        </div>
        <CopyButton text={msg.content} title="Copy entire user request" />
      </div>

      {isBlockExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
          {contextText && (
            <CollapsibleCard
              title="📄 Attached File Context"
              badge={msg.fileCount ? `${msg.fileCount} files` : 'xml'}
              defaultExpanded={false}
              contentToCopy={contextText}
            >
              {contextText}
            </CollapsibleCard>
          )}

          <CollapsibleCard
            title="💬 Instruction Prompt"
            defaultExpanded={true}
            contentToCopy={instructionText}
          >
            {instructionText}
          </CollapsibleCard>
        </div>
      )}

      <div
        style={{
          fontSize: '0.7em',
          opacity: 0.75,
          textAlign: 'right',
          marginTop: '4px',
          borderTop: isBlockExpanded ? '1px dashed var(--border)' : 'none',
          paddingTop: '3px',
          fontStyle: 'italic',
        }}
      >
        {formatDateTime(msg.timestamp)} | Context Files: {msg.fileCount ?? 0}
      </div>
    </div>
  );
};

const AssistantMessageBlock: React.FC<{
  msg: IChatMessageDto;
  fallbackProvider: LlmProvider;
  fallbackModel: string;
}> = ({ msg, fallbackProvider, fallbackModel }) => {
  const [isBlockExpanded, setIsBlockExpanded] = useState(true);
  const bubbleBg = 'var(--card)';
  const bubbleBorder = '1px solid var(--border)';

  return (
    <div
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bubbleBg,
        color: 'var(--card-foreground)',
        padding: '8px 12px',
        borderRadius: '8px',
        maxWidth: '85%',
        width: '100%',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        position: 'relative',
        border: bubbleBorder,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        onClick={() => setIsBlockExpanded(!isBlockExpanded)}
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: bubbleBg,
          zIndex: 2,
          paddingBottom: isBlockExpanded ? '4px' : '0px',
          marginBottom: isBlockExpanded ? '6px' : '0px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.78em',
          fontWeight: 'bold',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isBlockExpanded ? '1px dotted var(--border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isBlockExpanded ? '▼' : '►'}</span>
          <span>🤖 {(msg.provider || fallbackProvider).toUpperCase()} ({msg.model || fallbackModel})</span>
        </div>
        <CopyButton text={msg.content} title="Copy assistant response" />
      </div>

      {isBlockExpanded && <div>{msg.content}</div>}

      {(msg.promptTokens !== undefined || msg.executionTimeMs !== undefined) && (
        <div
          style={{
            fontSize: '0.7em',
            opacity: 0.65,
            textAlign: 'right',
            marginTop: '6px',
            borderTop: isBlockExpanded ? '1px dashed var(--border)' : 'none',
            paddingTop: '3px',
            fontStyle: 'italic',
          }}
        >
          In: {formatTokenCount(msg.promptTokens)} tokens | Out: {formatTokenCount(msg.completionTokens)} tokens | Time:{' '}
          {formatExecutionTime(msg.executionTimeMs)}
        </div>
      )}
    </div>
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
    handleAddFileContext,
    handleRemoveFileContext,
    handleSend,
  } = useLlmChat();

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', fontFamily: 'var(--font-sans)', color: 'var(--foreground)', backgroundColor: 'var(--background)' }}>
      <header style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>Provider:</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProvider)}
          style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px' }}
        >
          <option value={LlmProvider.OLLAMA}>🦙 Ollama</option>
          <option value={LlmProvider.GEMINI}>♊ Gemini</option>
          <option value={LlmProvider.COPILOT}>✈️ Copilot</option>
        </select>

        <label style={{ fontWeight: 'bold', marginLeft: '12px' }}>Model:</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{ background: 'var(--input)', color: 'var(--foreground)', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '4px' }}
        >
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <label style={{ marginLeft: '12px' }}>Temp ({temperature}):</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          style={{ width: '80px' }}
        />
      </header>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
        {messages.length === 0 ? (
          <div style={{ opacity: 0.6, fontStyle: 'italic', textAlign: 'center', marginTop: '32px' }}>
            No conversation started. Attach files as context and type your instruction below.
          </div>
        ) : (
          messages.map((msg) =>
            msg.role === 'user' ? (
              <UserMessageBlock key={msg.id} msg={msg} />
            ) : (
              <AssistantMessageBlock
                key={msg.id}
                msg={msg}
                fallbackProvider={provider}
                fallbackModel={selectedModel}
              />
            )
          )
        )}
      </div>

      <footer style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
        {attachedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8em', fontWeight: 'bold', opacity: 0.8 }}>Context Files:</span>
            {attachedFiles.map((file) => (
              <span
                key={file.path}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75em',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                📄 {file.path}
                <button
                  onClick={() => handleRemoveFileContext(file.path)}
                  title="Remove file context"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    padding: '0 2px',
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
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
            style={{
              flex: 1,
              background: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '4px 8px',
              fontSize: '0.85em',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleAddFileContext}
            disabled={isReadingFile || !filePathInput.trim()}
            style={{
              background: 'var(--secondary)',
              color: 'var(--secondary-foreground)',
              border: '1px solid var(--border)',
              padding: '4px 12px',
              cursor: isReadingFile || !filePathInput.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
              borderRadius: '4px',
            }}
          >
            {isReadingFile ? 'Reading...' : '+ Add Context'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
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
            style={{
              flex: 1,
              background: 'var(--input)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
              padding: '6px',
              resize: 'none',
              borderRadius: '4px',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              background: 'var(--primary)',
              color: 'var(--primary-foreground)',
              border: 'none',
              padding: '0 16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              borderRadius: '4px',
            }}
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </footer>
    </div>
  );
};
EOF

# 1e. use-prompt.ts
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/use-prompt.ts
import { useState } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useGraphRagExplorerStore } from './graph-rag-explorer-store';
import PREDEFINED_PROMPTS from './data/predefined-prompts.yaml';
import TEMPLATE_PROMPTS from './data/template-prompts.yaml';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';

export function usePrompt(handleCopy?: (text: string, message: string) => void) {
  const setNotification = useAppContextStore((s) => s.setNotification);
  const { promptFields, config, updatePromptFields, getFullPrompt } = useGraphRagExplorerStore();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    TEMPLATE_PROMPTS[0]?.id || ''
  );

  const notify = (msg: string) => {
    if (handleCopy) {
      handleCopy('', msg);
    } else {
      setNotification(msg);
    }
  };

  const handlePredefinedChange = (presetId: string) => {
    const found = PREDEFINED_PROMPTS.find((p: any) => p.id === presetId);
    if (found) {
      updatePromptFields({
        ...found.data,
        mode: found.data.mode as 'role' | 'agent',
        predefined: presetId,
      });
      notify(`Loaded predefined template: ${found.name}`);
    } else {
      updatePromptFields({ predefined: presetId });
    }
  };

  const handleCopyPrompt = async () => {
    const templateItem = TEMPLATE_PROMPTS.find((t: any) => t.id === selectedTemplateId);
    let fullPrompt = '';

    if (templateItem && templateItem.data) {
      const roleHeader =
        promptFields.mode === 'agent'
          ? `[AGENT]: ${promptFields.selectedAgent} (${promptFields.roleOrAgent})`
          : `${promptFields.roleOrAgent}`;

      const replacements: Record<string, string> = {
        '{{ ROLE_AGENT }}': roleHeader,
        '{{ TONE }}': promptFields.tone || '',
        '{{ GLOBAL_CONTEXT_SCOPE }}': config.systemPromptPrefix || '',
        '{{ TASK_CONTEXT_SCOPE }}': promptFields.context || '',
        '{{ EXPECTED_DELIVERABLES }}': promptFields.expected || '',
        '{{ OUTPUT_FORMAT_CONSTRAINTS }}': promptFields.output || '',
        '{{ REFERENCE_SAMPLES }}': promptFields.samples || '',
      };

      fullPrompt = templateItem.data;
      Object.entries(replacements).forEach(([key, value]) => {
        fullPrompt = fullPrompt.replaceAll(key, value);
      });
    } else {
      fullPrompt = getFullPrompt();
    }

    logInfo(`Full prompt generated: ${fullPrompt}`);

    try {
      await vsCodeApiService.copyToClipboard(fullPrompt);
      setNotification('✅ Full prompt copied to clipboard!');
    } catch {
      setNotification('❌ Failed to copy prompt to clipboard');
    }
  };

  const handleInsertAgent = () => {
    updatePromptFields({ roleOrAgent: `${promptFields.selectedAgent}: ${promptFields.roleOrAgent}` });
    notify(`Inserted agent ${promptFields.selectedAgent} into field!`);
  };

  return {
    promptFields,
    updatePromptFields,
    selectedTemplateId,
    setSelectedTemplateId,
    handlePredefinedChange,
    handleCopyPrompt,
    handleInsertAgent,
  };
}
EOF

# 1f. prompt.tsx
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/prompt.tsx
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
import { usePrompt } from './use-prompt';

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
EOF

# 1g. use-tabs-prompt.ts
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/use-tabs-prompt.ts
import { useExplorerStore } from '../store/useExplorerStore';

export function useTabsPrompt() {
  const activeTab = useExplorerStore((s) => s.promptTab);
  const setActiveTab = useExplorerStore((s) => s.setPromptTab);

  return {
    activeTab,
    setActiveTab,
  };
}
EOF

# 1h. tabs-prompt-container.tsx
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/tabs-prompt-container.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { PromptPanel } from './prompt';
import { LLMExplorerChat } from './LLM';
import { ConfigurationPanel } from './configuration';
import { SelectedEntity, CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useTabsPrompt } from './use-tabs-prompt';

interface TabsPromptContainerProps {
  selectedEntity?: SelectedEntity | null;
  initialCodebase?: CodebaseData;
  handleCopy?: (text: string, message: string) => void;
}

export function TabsPromptContainer({
  selectedEntity,
  initialCodebase,
  handleCopy
}: TabsPromptContainerProps) {
  const { activeTab, setActiveTab } = useTabsPrompt();

  return (
    <div className="flex flex-col bg-card h-full font-mono text-xs">
      <div className="flex bg-muted/40 border-border border-b overflow-x-auto shrink-0">
        <Button
          variant="ghost"
          onClick={() => setActiveTab('prompt')}
          className={`flex-1 min-w-[90px] py-2 text-[11px] font-bold rounded-none border-b-2 transition-all cursor-pointer ${
            activeTab === 'prompt' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Prompt Builder
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('llm')}
          className={`flex-1 min-w-[80px] py-2 text-[11px] font-bold rounded-none border-b-2 transition-all cursor-pointer ${
            activeTab === 'llm' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Local LLM
        </Button>
        <Button
          variant="ghost"
          onClick={() => setActiveTab('config')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 transition-all cursor-pointer ${
            activeTab === 'config' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'
          }`}
        >
          Config
        </Button>
      </div>

      <div className="flex-1 p-3 overflow-y-auto">
        {activeTab === 'prompt' && <PromptPanel handleCopy={handleCopy} />}
        {activeTab === 'llm' && <LLMExplorerChat />}
        {activeTab === 'config' && <ConfigurationPanel />}
      </div>
    </div>
  );
}
EOF

# ============================================================================
# 2. wkp-btm-infos hook & component
# ============================================================================

# 2a. use-wkp-bottom-panel.ts
cat << 'EOF' > webview/src/features/explorer/wkp-btm-infos/use-wkp-bottom-panel.ts
export function useWkpBottomPanel() {
  return {
    statusText: 'AST Compilation Log: Matrix Active',
  };
}
EOF

# 2b. wkp-bottom-panel.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-btm-infos/wkp-bottom-panel.tsx
import React from 'react';
import { useWkpBottomPanel } from './use-wkp-bottom-panel';

export function WkpBottomPanel() {
  const { statusText } = useWkpBottomPanel();

  return (
    <div className="px-4 py-2 font-medium text-muted-foreground text-xs">
      {statusText}
    </div>
  );
}
EOF

# ============================================================================
# 3. wkp-lft-codebase-tree hooks & components
# ============================================================================

# 3a. use-codebase-explorer-panel.ts
cat << 'EOF' > webview/src/features/explorer/wkp-lft-codebase-tree/use-codebase-explorer-panel.ts
import { useState, useMemo } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { FOLDER_KEYS_REGISTERED_CONFIG } from '../constants/graph.constants';

export function useCodebaseExplorerPanel(codebase: CodebaseData) {
  const [isImportOpen, setIsImportOpen] = useState(false);

  const handleExportCodebase = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(codebase, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "codebase-ast.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const registeredFolders = useMemo(() => [...FOLDER_KEYS_REGISTERED_CONFIG], []);
  const allFolderKeys = useMemo(() => {
    const hasOtherFiles = codebase.files.some(
      (f: CodebaseFile) => !registeredFolders.some((rf) => f.path.startsWith(rf))
    );
    return hasOtherFiles ? [...registeredFolders, 'other'] : registeredFolders;
  }, [codebase.files, registeredFolders]);

  return {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    registeredFolders,
    allFolderKeys,
  };
}
EOF

# 3b. CodebaseExplorerPanel.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-lft-codebase-tree/CodebaseExplorerPanel.tsx
import React, { useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder, FileCode, Database, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ImportAstDialog } from './import-ast-dialog';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';
import {
  CodebaseFile,
  CodebaseData,
  SelectedEntity
} from '@/shared/services/graph-rag-explorer';
import { FOLDER_THEME_REGISTRY_CONFIG } from '../constants/graph.constants';
import { useCodebaseExplorerPanel } from './use-codebase-explorer-panel';

interface TriStateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
  );
}

interface CodebaseExplorerPanelProps {
  codebase: CodebaseData;
  searchFilteredFiles: CodebaseFile[];
  expandedFolders: Record<string, boolean>;
  visibleFiles: Record<string, boolean>;
  toggleFolder: (folder: string) => void;
  toggleFolderCheckbox: (folder: string) => void;
  toggleFileCheckbox: (id: string) => void;
  setSelectedEntity: (entity: SelectedEntity) => void;
  onFocusNode?: (nodeId: string) => void;
  onImportCodebase?: (importedData: CodebaseData) => void;
}

export function CodebaseExplorerPanel({
  codebase,
  searchFilteredFiles,
  expandedFolders,
  visibleFiles,
  toggleFolder,
  toggleFolderCheckbox,
  toggleFileCheckbox,
  setSelectedEntity,
  onFocusNode,
  onImportCodebase
}: CodebaseExplorerPanelProps) {
  const {
    isImportOpen,
    setIsImportOpen,
    handleExportCodebase,
    registeredFolders,
    allFolderKeys,
  } = useCodebaseExplorerPanel(codebase);

  return (
    <div id="panel-codebase-explorer" className="flex flex-col bg-card h-full">
      <div className="flex justify-end items-center bg-muted/20 p-1 border-border border-b">
        <ToolbarSeparator />

        <Button
          id="btn-open-import-ast-dialog"
          className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
          variant="ghost"
          size="icon"
          onClick={() => setIsImportOpen(true)}
          data-tooltip="Open AST Codebase import dialog"
        >
          <Upload size={12} />
        </Button>

        <Button
          id="btn-export-ast-json"
          className="hover:bg-muted p-1.5 rounded w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
          variant="ghost"
          size="icon"
          onClick={handleExportCodebase}
          data-tooltip="Export current session structure as AST Codebase to JSON file"
        >
          <Download size={12} />
        </Button>
      </div>

      <ImportAstDialog
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        onImport={(data) => {
          if (onImportCodebase) onImportCodebase(data);
        }}
      />

      <div id="tree-codebase-files" className="flex-1 p-4 overflow-y-auto font-mono text-xs">
        {allFolderKeys.map((folder) => {
          const theme = FOLDER_THEME_REGISTRY_CONFIG[folder] || FOLDER_THEME_REGISTRY_CONFIG.default;
          const isRegistered = registeredFolders.includes(folder as any);
          const folderFiles = (isRegistered
            ? codebase.files.filter((f: CodebaseFile) => f.path.startsWith(folder))
            : codebase.files.filter((f: CodebaseFile) => !registeredFolders.some((rf) => f.path.startsWith(rf)))
          ).sort((a: CodebaseFile, b: CodebaseFile) =>
            a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
          );

          if (folderFiles.length === 0 && !isRegistered) return null;

          const isAllChecked = folderFiles.length > 0 && folderFiles.every((f: CodebaseFile) => visibleFiles[f.id]);
          const isSomeChecked = folderFiles.some((f: CodebaseFile) => visibleFiles[f.id]);
          const isIndeterminate = isSomeChecked && !isAllChecked;

          return (
            <div key={folder} className="mb-4">
              <div className="group flex items-center gap-1.5 hover:bg-muted/50 px-1 py-1 rounded">
                <TriStateCheckbox
                  checked={isAllChecked}
                  indeterminate={isIndeterminate}
                  onChange={() => toggleFolderCheckbox(folder)}
                  className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                />
                <div className="flex flex-1 items-center gap-1.5 min-w-0 cursor-pointer" onClick={() => toggleFolder(folder)}>
                  {expandedFolders[folder] ? <ChevronDown size={14} className="shrink-0" /> : <ChevronRight size={14} className="shrink-0" />}
                  <Folder size={15} className={`${theme.fill} ${theme.text} shrink-0`} />
                  <span className="font-bold truncate">{folder}/</span>
                </div>
              </div>
              {expandedFolders[folder] && (
                <div className="space-y-1 mt-1 ml-2.5 pl-6 border-border border-l">
                  {folderFiles.map((file: CodebaseFile) => (
                    <div key={file.id} className="group flex items-center gap-1.5 hover:bg-muted px-2 py-1 rounded">
                      <input
                        type="checkbox"
                        checked={!!visibleFiles[file.id]}
                        onChange={() => toggleFileCheckbox(file.id)}
                        className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                      />
                      <span
                        className={`flex items-center gap-1.5 truncate cursor-pointer flex-1 min-w-0 ${visibleFiles[file.id] ? 'text-foreground font-medium' : 'text-muted-foreground line-through'}`}
                        onClick={() => {
                          if (onFocusNode) {
                            onFocusNode(file.id);
                          } else {
                            setSelectedEntity({ type: 'node', nodeId: file.id });
                          }
                        }}
                      >
                        {folder === 'config' ? (
                          <Database size={13} className="text-amber-500 shrink-0" />
                        ) : (
                          <FileCode size={13} className={file.type === 'interface' ? 'text-indigo-400 shrink-0' : (folder === 'frontend' ? 'text-emerald-500 shrink-0' : folder === 'backend' ? 'text-blue-500 shrink-0' : 'text-slate-400 shrink-0')} />
                        )}
                        <span className="truncate">{file.name}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div id="panel-codebase-explorer-bottom" className="bg-muted/20 p-3 border-border border-t">
        <div>
          <h3 className="flex items-center gap-2 font-mono font-bold text-muted-foreground text-xs uppercase tracking-wider">
            <span>Codebase Explorer</span>
            <span id="badge-file-count" className="bg-muted px-2 py-0.5 rounded text-[10px] text-foreground">
              {searchFilteredFiles.length}/{codebase.files.length}
            </span>
          </h3>
        </div>
      </div>
    </div>
  );
}
EOF

# 3c. use-import-ast-dialog.ts
cat << 'EOF' > webview/src/features/explorer/wkp-lft-codebase-tree/use-import-ast-dialog.ts
import { useState, useRef, useEffect } from 'react';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function useImportAstDialog(
  onOpenChange: (open: boolean) => void,
  onImport: (data: CodebaseData) => void
) {
  const [isDragging, setIsDragging] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const preventGlobalDnD = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'none';
      }
    };

    window.addEventListener('dragenter', preventGlobalDnD, false);
    window.addEventListener('dragover', preventGlobalDnD, false);
    window.addEventListener('drop', preventGlobalDnD, false);

    return () => {
      window.removeEventListener('dragenter', preventGlobalDnD, false);
      window.removeEventListener('dragover', preventGlobalDnD, false);
      window.removeEventListener('drop', preventGlobalDnD, false);
    };
  }, []);

  const parseAndValidate = (text: string): CodebaseData | null => {
    try {
      const parsed = JSON.parse(text);
      if (!parsed || !Array.isArray(parsed.files) || !Array.isArray(parsed.dependencies)) {
        setErrorMsg("Invalid AST JSON schema: payload must contain 'files' and 'dependencies' arrays.");
        return null;
      }
      setErrorMsg(null);
      return parsed;
    } catch (err: any) {
      setErrorMsg(`JSON Parse Error: ${err.message || err}`);
      return null;
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setJsonText(content);
      parseAndValidate(content);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read the selected file payload.');
    };
    reader.readAsText(file);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
    if (e.target) e.target.value = '';
  };

  const handleBrowseClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleConfirmImport = () => {
    const data = parseAndValidate(jsonText);
    if (data) {
      onImport(data);
      onOpenChange(false);
      setJsonText('');
      setFileName(null);
      setErrorMsg(null);
    }
  };

  return {
    isDragging,
    jsonText,
    setJsonText,
    errorMsg,
    fileName,
    fileInputRef,
    parseAndValidate,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleBrowseClick,
    handleConfirmImport,
  };
}
EOF

# 3d. import-ast-dialog.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-lft-codebase-tree/import-ast-dialog.tsx
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileCode, CheckCircle2, AlertCircle, FolderOpen } from "lucide-react";
import { CodebaseData } from "@/shared/services/graph-rag-explorer";
import { useImportAstDialog } from "./use-import-ast-dialog";

interface ImportAstDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (data: CodebaseData) => void;
}

export function ImportAstDialog({ open, onOpenChange, onImport }: ImportAstDialogProps) {
  const {
    isDragging,
    jsonText,
    setJsonText,
    errorMsg,
    fileName,
    fileInputRef,
    parseAndValidate,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInputChange,
    handleBrowseClick,
    handleConfirmImport,
  } = useImportAstDialog(onOpenChange, onImport);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent id="dialog-import-ast" className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle id="title-import-ast" className="flex items-center gap-2 font-mono font-bold text-sm">
            <Upload size={16} className="text-primary" /> Import AST Data Schema
          </DialogTitle>
          <DialogDescription id="desc-import-ast" className="text-xs">
            Drop an AST .json extraction file, click to browse local files, or paste JSON below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <input
            id="input-file-ast-picker"
            type="file"
            accept=".json,application/json"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div
            id="dropzone-ast-json"
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all select-none text-center cursor-pointer ${
              isDragging
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : "border-border bg-muted/20 hover:border-primary/50"
            }`}
          >
            <Upload size={28} className={isDragging ? "text-primary animate-bounce mb-1" : "text-muted-foreground mb-1"} />
            <div className="pointer-events-none">
              {fileName ? (
                <span className="flex items-center gap-1.5 font-mono font-bold text-emerald-500 text-xs">
                  <CheckCircle2 size={14} /> Selected: {fileName}
                </span>
              ) : (
                <span className="font-mono font-medium text-foreground text-xs">Select local extraction file payload</span>
              )}
              <p className="mt-1 font-mono text-[10px] text-muted-foreground">Drag & Drop .json AST file here</p>
            </div>

            <Button
              id="btn-browse-file"
              type="button"
              variant="default"
              size="sm"
              className="flex items-center gap-1.5 shadow-md mt-4 text-xs"
            >
              <FolderOpen size={14} /> Browse Local Files
            </Button>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1 font-mono font-semibold text-muted-foreground text-xs uppercase">
              <FileCode size={13} /> Direct JSON Input
            </span>
          </div>

          <Textarea
            id="textarea-ast-json-paste"
            placeholder='{\n  "files": [...],\n  "dependencies": [...]\n}'
            className="bg-muted/40 h-28 font-mono text-xs resize-none"
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              if (e.target.value) parseAndValidate(e.target.value);
              else setJsonText('');
            }}
          />

          {errorMsg && (
            <div id="notice-import-ast-error" className="flex items-center gap-2 bg-destructive/15 p-2.5 border border-destructive/30 rounded font-mono text-destructive text-xs">
              <AlertCircle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            id="btn-cancel-import-ast"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            id="btn-confirm-import-ast"
            size="sm"
            disabled={!jsonText || !!errorMsg}
            onClick={handleConfirmImport}
          >
            Import Codebase
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
EOF

# ============================================================================
# 4. wkp-rgt-tabs-files-context hooks & components
# ============================================================================

# 4a. use-context-transformer.ts
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/use-context-transformer.ts
import { useState, useMemo, useCallback } from 'react';
import { CodebaseData, CodebaseFile } from '@/shared/services/graph-rag-explorer';

export interface AnonymizationRule {
  id: string;
  name: string;
  pattern: string;
  replacement: string;
  inversePattern: string;
  enabled: boolean;
}

const DEFAULT_ANONYMIZATION_RULES: AnonymizationRule[] = [
  {
    id: 'rule-secrets',
    name: 'Secret & Password Tokens',
    pattern: '(?i)(password|secret|key|token)\\s*[:=]\\s*[\'"][^\'"]+[\'"]',
    replacement: '$1: "ANONYMIZED_SECRET"',
    inversePattern: 'ANONYMIZED_SECRET',
    enabled: true,
  },
  {
    id: 'rule-db-uri',
    name: 'Database JDBC/Connection URIs',
    pattern: 'jdbc:[a-z0-9]+://[^:\\s]+:[0-9]+/[a-zA-Z0-9_]+',
    replacement: 'jdbc:provider://anonymized-host:5432/anon_db',
    inversePattern: 'jdbc:provider://anonymized-host:5432/anon_db',
    enabled: true,
  },
  {
    id: 'rule-ip',
    name: 'IPv4 Addresses',
    pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b',
    replacement: '127.0.0.1',
    inversePattern: '127.0.0.1',
    enabled: true,
  },
  {
    id: 'rule-db-user',
    name: 'Database Usernames',
    pattern: 'db_admin_prod',
    replacement: 'db_user_anon',
    inversePattern: 'db_user_anon',
    enabled: true,
  },
];

export function useContextTransformer(initialCodebase: CodebaseData) {
  const [rules, setRules] = useState<AnonymizationRule[]>(DEFAULT_ANONYMIZATION_RULES);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleReplacement, setNewRuleReplacement] = useState('');
  const [newRuleInverse, setNewRuleInverse] = useState('');

  const [llmResponseInput, setLlmResponseInput] = useState('');
  const [anonymizedResult, setAnonymizedResult] = useState<string>('');
  const [deanonymizedResult, setDeanonymizedResult] = useState<string>('');
  const [substitutionMap, setSubstitutionMap] = useState<Record<string, string>>({});

  const rawUnifiedContext = useMemo(() => {
    if (!initialCodebase?.files) return '';
    return initialCodebase.files
      .map((file: CodebaseFile) => {
        let block = `/// --- BEGIN FILE: ${file.path} (${file.language}) ---\n`;
        if (file.configProperties && file.configProperties.length > 0) {
          file.configProperties.forEach((p) => {
            block += `${p.key}=${p.value}\n`;
          });
        }
        if (file.attributes && file.attributes.length > 0) {
          file.attributes.forEach((a) => {
            block += `property ${a.visibility} ${a.name};\n`;
          });
        }
        if (file.methods && file.methods.length > 0) {
          file.methods.forEach((m) => {
            block += `function ${m.name} { // ${m.description} }\n`;
          });
        }
        block += `/// --- END FILE: ${file.path} ---\n`;
        return block;
      })
      .join('\n');
  }, [initialCodebase]);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  }, []);

  const handleAddRule = useCallback(() => {
    if (!newRulePattern || !newRuleReplacement) return;
    const rule: AnonymizationRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName || 'Custom Regex Rule',
      pattern: newRulePattern,
      replacement: newRuleReplacement,
      inversePattern: newRuleInverse || newRuleReplacement,
      enabled: true,
    };
    setRules((prev) => [...prev, rule]);
    setNewRuleName('');
    setNewRulePattern('');
    setNewRuleReplacement('');
    setNewRuleInverse('');
  }, [newRuleName, newRulePattern, newRuleReplacement, newRuleInverse]);

  const handleDeleteRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleAnonymize = useCallback(() => {
    let transformed = rawUnifiedContext;
    const newSubMap: Record<string, string> = {};

    rules.filter((r) => r.enabled).forEach((rule) => {
      try {
        const regex = new RegExp(rule.pattern, 'g');
        const matches = rawUnifiedContext.match(regex);
        if (matches) {
          matches.forEach((original) => {
            const replaced = original.replace(regex, rule.replacement);
            newSubMap[replaced] = original;
          });
        }
        transformed = transformed.replace(regex, rule.replacement);
      } catch (err) {
        console.error(`Regex error in rule ${rule.name}:`, err);
      }
    });

    setAnonymizedResult(transformed);
    setSubstitutionMap(newSubMap);
  }, [rawUnifiedContext, rules]);

  const handleDeanonymize = useCallback(() => {
    if (!llmResponseInput) return;
    let restored = llmResponseInput;

    Object.entries(substitutionMap).forEach(([anonymized, original]) => {
      restored = restored.split(anonymized).join(original);
    });

    rules.filter((r) => r.enabled && r.inversePattern).forEach((rule) => {
      try {
        const regex = new RegExp(rule.inversePattern, 'g');
        restored = restored.replace(regex, (match) => {
          return substitutionMap[match] || match;
        });
      } catch (err) {
        console.error(`Inverse regex error in rule ${rule.name}:`, err);
      }
    });

    setDeanonymizedResult(restored);
  }, [llmResponseInput, substitutionMap, rules]);

  return {
    rules,
    newRuleName,
    setNewRuleName,
    newRulePattern,
    setNewRulePattern,
    newRuleReplacement,
    setNewRuleReplacement,
    newRuleInverse,
    setNewRuleInverse,
    llmResponseInput,
    setLlmResponseInput,
    anonymizedResult,
    deanonymizedResult,
    substitutionMap,
    toggleRule,
    handleAddRule,
    handleDeleteRule,
    handleAnonymize,
    handleDeanonymize,
  };
}
EOF

# 4b. context-transformer.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/context-transformer.tsx
import React from 'react';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  Lock,
  Unlock,
  Sliders
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';
import { useContextTransformer } from './use-context-transformer';

interface ContextTransformerPanelProps {
  initialCodebase: CodebaseData;
  handleCopy: (text: string, message: string) => void;
}

export function ContextTransformerPanel({
  initialCodebase,
  handleCopy
}: ContextTransformerPanelProps) {
  const {
    rules,
    newRuleName,
    setNewRuleName,
    newRulePattern,
    setNewRulePattern,
    newRuleReplacement,
    setNewRuleReplacement,
    newRuleInverse,
    setNewRuleInverse,
    llmResponseInput,
    setLlmResponseInput,
    anonymizedResult,
    deanonymizedResult,
    substitutionMap,
    toggleRule,
    handleAddRule,
    handleDeleteRule,
    handleAnonymize,
    handleDeanonymize,
  } = useContextTransformer(initialCodebase);

  return (
    <div className="space-y-4 animate-in duration-200 fade-in font-mono text-xs">
      <div className="bg-primary/5 p-3.5 border border-primary/20 rounded-lg">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
          <div>
            <h4 className="font-bold text-foreground text-sm uppercase">Context Anonymizer & Transformer</h4>
            <p className="text-[10px] text-muted-foreground">
              Configure regex replacement rules to anonymize single-file context before sending to LLMs, and maintain inverse rules for output de-anonymization.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Sliders size={13} className="text-primary" /> Anonymization Regex Rules
          </span>
          <span className="bg-primary/10 px-2 py-0.5 rounded text-[10px] text-primary font-bold">
            {rules.filter((r) => r.enabled).length}/{rules.length} Active
          </span>
        </div>

        <div className="border border-border/70 rounded-md overflow-x-auto">
          <table className="w-full text-left font-mono text-[11px]">
            <thead className="bg-muted/60 text-[10px] text-muted-foreground uppercase border-b border-border/70">
              <tr>
                <th className="p-2 w-10 text-center">Active</th>
                <th className="p-2">Rule Name</th>
                <th className="p-2">Match Pattern (Regex)</th>
                <th className="p-2">Replacement</th>
                <th className="p-2">Inverse Pattern</th>
                <th className="p-2 w-10 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {rules.map((rule) => (
                <tr key={rule.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={() => toggleRule(rule.id)}
                      className="rounded text-primary cursor-pointer shrink-0"
                    />
                  </td>
                  <td className="p-2 font-semibold text-foreground truncate max-w-[120px]">{rule.name}</td>
                  <td className="p-2 text-amber-500 font-mono truncate max-w-[150px]">{rule.pattern}</td>
                  <td className="p-2 text-emerald-500 font-mono truncate max-w-[140px]">{rule.replacement}</td>
                  <td className="p-2 text-indigo-400 font-mono truncate max-w-[140px]">{rule.inversePattern}</td>
                  <td className="p-2 text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="w-6 h-6 text-destructive hover:text-destructive/80"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-2.5 bg-muted/20 border border-border/50 rounded-md space-y-2">
          <span className="block font-bold text-[10px] text-muted-foreground uppercase">Add Custom Regex Rule</span>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Rule Name (e.g. Domain Anonymizer)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="bg-background h-7 text-xs"
            />
            <Input
              placeholder="Regex Pattern (e.g. \\bcorp\\.com)"
              value={newRulePattern}
              onChange={(e) => setNewRulePattern(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
            <Input
              placeholder="Replacement (e.g. anon.org)"
              value={newRuleReplacement}
              onChange={(e) => setNewRuleReplacement(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
            <Input
              placeholder="Inverse Pattern (for de-anonymization)"
              value={newRuleInverse}
              onChange={(e) => setNewRuleInverse(e.target.value)}
              className="bg-background h-7 text-xs font-mono"
            />
          </div>
          <div className="flex justify-end pt-1">
            <Button
              size="sm"
              onClick={handleAddRule}
              disabled={!newRulePattern || !newRuleReplacement}
              className="flex items-center gap-1 h-7 text-xs"
            >
              <Plus size={12} /> Add Rule
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Lock size={13} className="text-orange-500" /> 1. Anonymize Unified Context
          </span>
          <Button
            size="sm"
            onClick={handleAnonymize}
            className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white h-7 text-xs"
          >
            <Sparkles size={12} /> Transform & Anonymize
          </Button>
        </div>

        {anonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-emerald-500 font-bold uppercase">
                ✅ Anonymized Context ({Object.keys(substitutionMap).length} Substitutions Mapped)
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(anonymizedResult, "Anonymized context copied to clipboard!")}
                className="h-6 text-[10px] gap-1"
              >
                <Copy size={10} /> Copy Anonymized Context
              </Button>
            </div>
            <Textarea
              readOnly
              value={anonymizedResult}
              className="bg-slate-950 font-mono text-[10px] text-slate-200 h-36 resize-none border-slate-800"
            />
          </div>
        )}
      </div>

      <div className="space-y-3 bg-card p-3 border border-border rounded-lg">
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-1.5 font-bold text-foreground text-xs uppercase">
            <Unlock size={13} className="text-indigo-400" /> 2. De-anonymize LLM Response
          </span>
          <Button
            size="sm"
            onClick={handleDeanonymize}
            disabled={!llmResponseInput}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white h-7 text-xs"
          >
            Restore Original Terms
          </Button>
        </div>

        <Textarea
          placeholder="Paste raw LLM response here to reverse substitution rules..."
          value={llmResponseInput}
          onChange={(e) => setLlmResponseInput(e.target.value)}
          className="bg-muted/30 font-mono text-[10px] h-20 resize-none"
        />

        {deanonymizedResult && (
          <div className="space-y-2 pt-1 animate-in duration-150 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-indigo-400 font-bold uppercase">
                🔓 De-anonymized Output
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleCopy(deanonymizedResult, "De-anonymized output copied to clipboard!")}
                className="h-6 text-[10px] gap-1"
              >
                <Copy size={10} /> Copy Restored Output
              </Button>
            </div>
            <Textarea
              readOnly
              value={deanonymizedResult}
              className="bg-slate-950 font-mono text-[10px] text-slate-200 h-32 resize-none border-slate-800"
            />
          </div>
        )}
      </div>
    </div>
  );
}
EOF

# 4c. use-files-context.ts
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/use-files-context.ts
import { useMemo, useEffect } from 'react';
import { CodebaseData, CodebaseFile, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { calculateTransitiveImpact } from '@/services/view/graph-view.service';
import { useFilesCtxExportStore } from '../components/files-ctx-export/use-files-ctx-export-store';
import { useExplorerStore } from '../store/useExplorerStore';

export interface DepthFileGroup {
  key: string;
  label: string;
  order: number;
  files: CodebaseFile[];
}

export function useFilesContext(
  initialCodebase: CodebaseData,
  selectedEntity: SelectedEntity | null,
  enableDownstream: boolean,
  enableUpstream: boolean,
  impactedSet: Set<string>
) {
  const setTargetFilePaths = useFilesCtxExportStore((s) => s.setTargetFilePaths);

  const selectedFiles = useExplorerStore((s) => s.selectedContextFiles);
  const setSelectedFiles = useExplorerStore((s) => s.setSelectedContextFiles);
  const expandedGroups = useExplorerStore((s) => s.expandedContextGroups);
  const setExpandedGroups = useExplorerStore((s) => s.setExpandedContextGroups);

  const downstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const dsSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, 20, 20, true, false);
    return initialCodebase.files.filter((f) => dsSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase]);

  const upstreamCount = useMemo(() => {
    if (!selectedEntity || !initialCodebase?.dependencies) return 0;
    const usSet = calculateTransitiveImpact(selectedEntity, initialCodebase.dependencies, 20, 20, false, true);
    return initialCodebase.files.filter((f) => usSet.has(f.id) && f.id !== selectedEntity.nodeId).length;
  }, [selectedEntity, initialCodebase]);

  const depthGroups = useMemo<DepthFileGroup[]>(() => {
    if (!selectedEntity || !initialCodebase?.files) return [];

    const targetId = selectedEntity.nodeId;
    const deps = initialCodebase.dependencies || [];

    const dsDepthMap = new Map<string, number>();
    const dsQueue: Array<{ id: string; depth: number }> = [{ id: targetId, depth: 0 }];
    dsDepthMap.set(targetId, 0);

    while (dsQueue.length > 0) {
      const { id, depth } = dsQueue.shift()!;
      deps.forEach((dep) => {
        const src = dep.sourceNode || dep.source;
        const tgt = dep.targetNode || dep.target;
        if (src === id && tgt) {
          if (!dsDepthMap.has(tgt) || dsDepthMap.get(tgt)! > depth + 1) {
            dsDepthMap.set(tgt, depth + 1);
            dsQueue.push({ id: tgt, depth: depth + 1 });
          }
        }
      });
    }

    const usDepthMap = new Map<string, number>();
    const usQueue: Array<{ id: string; depth: number }> = [{ id: targetId, depth: 0 }];
    usDepthMap.set(targetId, 0);

    while (usQueue.length > 0) {
      const { id, depth } = usQueue.shift()!;
      deps.forEach((dep) => {
        const src = dep.sourceNode || dep.source;
        const tgt = dep.targetNode || dep.target;
        if (tgt === id && src) {
          if (!usDepthMap.has(src) || usDepthMap.get(src)! > depth + 1) {
            usDepthMap.set(src, depth + 1);
            usQueue.push({ id: src, depth: depth + 1 });
          }
        }
      });
    }

    const groupsMap = new Map<string, DepthFileGroup>();

    const getOrCreateGroup = (key: string, label: string, order: number) => {
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { key, label, order, files: [] });
      }
      return groupsMap.get(key)!;
    };

    initialCodebase.files.forEach((file) => {
      const isTarget = file.id === targetId;
      const isImpacted =
        impactedSet.has(file.id) ||
        Array.from(impactedSet).some((item) => item === file.id || item.startsWith(file.id + '::'));

      if (!isImpacted && !isTarget) return;

      if (isTarget) {
        getOrCreateGroup('target', 'Selected Target File', 150).files.push(file);
      } else {
        const usDepth = usDepthMap.get(file.id);
        const dsDepth = dsDepthMap.get(file.id);

        if (enableUpstream && usDepth !== undefined && usDepth > 0) {
          const key = `upstream-${usDepth}`;
          const label = `Upstream Depth ${usDepth} (Callers)`;
          getOrCreateGroup(key, label, 100 + usDepth).files.push(file);
        } else if (enableDownstream && dsDepth !== undefined && dsDepth > 0) {
          const key = `downstream-${dsDepth}`;
          const label = `Downstream Depth ${dsDepth} (Callees)`;
          getOrCreateGroup(key, label, 200 + dsDepth).files.push(file);
        } else if (usDepth !== undefined && usDepth > 0) {
          const key = `upstream-${usDepth}`;
          const label = `Upstream Depth ${usDepth} (Callers)`;
          getOrCreateGroup(key, label, 100 + usDepth).files.push(file);
        } else if (dsDepth !== undefined && dsDepth > 0) {
          const key = `downstream-${dsDepth}`;
          const label = `Downstream Depth ${dsDepth} (Callees)`;
          getOrCreateGroup(key, label, 200 + dsDepth).files.push(file);
        } else {
          getOrCreateGroup('other-impacted', 'Other Impacted Files', 300).files.push(file);
        }
      }
    });

    return Array.from(groupsMap.values()).sort((a, b) => a.order - b.order);
  }, [selectedEntity, initialCodebase, impactedSet, enableUpstream, enableDownstream]);

  const getGroupStyle = (key: string) => {
    if (key === 'target') {
      return {
        border: 'border-orange-500/20 dark:border-orange-500/30',
        bgHeader: 'bg-orange-500/10 border-b border-orange-500/20',
        text: 'text-orange-500',
        icon: 'text-orange-500',
      };
    }
    if (key.startsWith('upstream')) {
      return {
        border: 'border-indigo-500/30 dark:border-indigo-500/40',
        bgHeader: 'bg-indigo-500/10 border-b border-indigo-500/20',
        text: 'text-indigo-600 dark:text-indigo-400',
        icon: 'text-indigo-500 dark:text-indigo-400',
      };
    }
    if (key.startsWith('downstream')) {
      return {
        border: 'border-blue-500/30 dark:border-blue-500/40',
        bgHeader: 'bg-blue-500/10 border-b border-blue-500/20',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500 dark:text-blue-400',
      };
    }
    return {
      border: 'border-emerald-500/40 dark:border-emerald-500/50',
      bgHeader: 'bg-emerald-500/15 border-b border-emerald-500/30',
      text: 'text-emerald-600 dark:text-emerald-400 font-bold',
      icon: 'text-emerald-500 dark:text-emerald-400',
    };
  };

  useEffect(() => {
    const initialSelected: Record<string, boolean> = {};
    const initialExpanded: Record<string, boolean> = {};

    depthGroups.forEach((group) => {
      initialExpanded[group.key] = true;
      group.files.forEach((file) => {
        initialSelected[file.id] = true;
      });
    });

    setSelectedFiles((prev) => {
      const updated = { ...initialSelected };
      Object.keys(prev).forEach((id) => {
        if (id in updated) {
          updated[id] = prev[id];
        }
      });
      return updated;
    });

    setExpandedGroups((prev) => ({ ...initialExpanded, ...prev }));
  }, [depthGroups, setSelectedFiles, setExpandedGroups]);

  const toggleGroupCheckbox = (groupKey: string, groupFiles: CodebaseFile[]) => {
    const isAllChecked = groupFiles.length > 0 && groupFiles.every((f) => selectedFiles[f.id]);
    const targetState = !isAllChecked;

    setSelectedFiles((prev) => {
      const updated = { ...prev };
      groupFiles.forEach((file) => {
        updated[file.id] = targetState;
      });
      return updated;
    });
  };

  const toggleFileCheckbox = (fileId: string) => {
    setSelectedFiles((prev) => ({
      ...prev,
      [fileId]: !prev[fileId],
    }));
  };

  const toggleGroupExpand = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedFiles).filter(Boolean).length;
  }, [selectedFiles]);

  const selectedUpstreamCount = useMemo(() => {
    return depthGroups
      .filter((g) => g.key.startsWith('upstream'))
      .reduce((acc, g) => acc + g.files.filter((f) => selectedFiles[f.id]).length, 0);
  }, [depthGroups, selectedFiles]);

  const selectedDownstreamCount = useMemo(() => {
    return depthGroups
      .filter((g) => g.key.startsWith('downstream'))
      .reduce((acc, g) => acc + g.files.filter((f) => selectedFiles[f.id]).length, 0);
  }, [depthGroups, selectedFiles]);

  const totalFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase]);

  const combinedSelectedFilesContext = useMemo(() => {
    if (!initialCodebase?.files) return '';

    return initialCodebase.files
      .filter((file) => !!selectedFiles[file.id])
      .map((file: CodebaseFile) => file.path)
      .join('\n');
  }, [initialCodebase, selectedFiles]);

  const targetFilePaths = useMemo(() => {
    return combinedSelectedFilesContext
      ? combinedSelectedFilesContext.split('\n').map((p) => p.trim()).filter(Boolean)
      : [];
  }, [combinedSelectedFilesContext]);

  useEffect(() => {
    setTargetFilePaths(targetFilePaths);
  }, [targetFilePaths, setTargetFilePaths]);

  return {
    downstreamCount,
    upstreamCount,
    depthGroups,
    getGroupStyle,
    selectedFiles,
    expandedGroups,
    toggleGroupCheckbox,
    toggleFileCheckbox,
    toggleGroupExpand,
    selectedCount,
    selectedUpstreamCount,
    selectedDownstreamCount,
    totalFilesContext,
    combinedSelectedFilesContext,
    targetFilePaths,
  };
}
EOF

# 4d. files-context.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/files-context.tsx
import React, { useEffect, useRef } from 'react';
import { GitFork, FileText, ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { FilesCtxExportPanel } from '../components/files-ctx-export/files-ctx-export-panel';
import { useFilesContext } from './use-files-context';

interface FilesContextPanelProps {
  initialCodebase: CodebaseData;
  selectedEntity: SelectedEntity | null;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

interface TriStateCheckboxProps {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  className?: string;
}

function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={className}
    />
  );
}

export function FilesContextPanel({
  initialCodebase,
  selectedEntity,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: FilesContextPanelProps) {
  const {
    downstreamCount,
    upstreamCount,
    depthGroups,
    getGroupStyle,
    selectedFiles,
    expandedGroups,
    toggleGroupCheckbox,
    toggleFileCheckbox,
    toggleGroupExpand,
    selectedCount,
    selectedUpstreamCount,
    selectedDownstreamCount,
    totalFilesContext,
    combinedSelectedFilesContext,
    targetFilePaths,
  } = useFilesContext(
    initialCodebase,
    selectedEntity,
    enableDownstream,
    enableUpstream,
    impactedSet
  );

  const topContent = (
    <div className="space-y-2 mb-2 w-full">
      <div className="space-y-3 bg-card p-4 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Unified Files Context
            </h4>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-4 text-center">
          <div className="bg-muted/40 p-2 border border-border/50 rounded">
            <span className="block text-[9px] text-muted-foreground truncate uppercase">Total Files</span>
            <span className="font-bold text-foreground text-xs">{initialCodebase?.files?.length || 0}</span>
          </div>
          <div className="bg-indigo-500/10 p-2 border border-indigo-500/20 rounded">
            <span className="block text-[9px] text-indigo-500 truncate uppercase">Upstream</span>
            <span className="font-bold text-indigo-500 text-xs">{upstreamCount}</span>
          </div>
          <div className="bg-blue-500/10 p-2 border border-blue-500/20 rounded">
            <span className="block text-[9px] text-blue-500 truncate uppercase">Downstream</span>
            <span className="font-bold text-blue-500 text-xs">{downstreamCount}</span>
          </div>
          <div className="bg-yellow-500/10 p-2 border border-yellow-500/30 rounded">
            <span className="block text-[9px] text-yellow-600 dark:text-yellow-400 truncate uppercase">Token Size</span>
            <span className="font-bold text-yellow-600 dark:text-yellow-400 text-xs">{(totalFilesContext.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

      <div className="space-y-2 bg-muted/30 p-3 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <label className="font-mono font-bold text-[11px] text-muted-foreground uppercase">Impact Propagation</label>
          <span className="bg-amber-500/10 px-2 py-0.5 border border-amber-500/30 rounded font-mono text-[10px] text-amber-500">Transitive BFS</span>
        </div>
        <div className="gap-2 grid grid-cols-2">
          <Button
            onClick={() => setEnableUpstream((prev) => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableUpstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} />
            Upstream ({upstreamCount})
          </Button>
          <Button
            onClick={() => setEnableDownstream((prev) => !prev)}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 font-mono text-xs font-bold rounded border transition-all h-9 cursor-pointer ${
              enableDownstream
                ? 'bg-orange-500 border-orange-400 text-white shadow-md'
                : 'bg-muted border-border text-foreground hover:bg-muted/80'
            }`}
          >
            <GitFork size={13} className="rotate-180" />
            Downstream ({downstreamCount})
          </Button>
        </div>
      </div>
    </div>
  );

  const middleContent = (
    <div className="space-y-3 py-2 pr-1 w-full font-mono text-xs">
      <div className="space-y-3 bg-orange-500/5 p-4 border border-orange-500/25 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-orange-500" />
            <h5 className="font-mono font-bold text-orange-500 text-xs">Fluorescent Impact Plan</h5>
          </div>
          <span className="bg-orange-500/10 px-2 py-0.5 border border-orange-500/20 rounded font-mono font-bold text-[10px] text-orange-500">
            {selectedCount} Selected
          </span>
        </div>

        <div className="space-y-2 pr-1 max-h-60 overflow-y-auto">
          {depthGroups.length === 0 ? (
            <div className="py-2 text-[11px] text-muted-foreground text-center italic">
              No impacted files or selected target entity.
            </div>
          ) : (
            depthGroups.map((group) => {
              const groupFiles = group.files;
              const isAllChecked = groupFiles.length > 0 && groupFiles.every((f) => selectedFiles[f.id]);
              const isSomeChecked = groupFiles.some((f) => selectedFiles[f.id]);
              const isIndeterminate = isSomeChecked && !isAllChecked;
              const isExpanded = expandedGroups[group.key] ?? true;
              const style = getGroupStyle(group.key);

              return (
                <div key={group.key} className={`border ${style.border} rounded-md bg-background/60 overflow-hidden`}>
                  <div className={`flex items-center justify-between px-2 py-1.5 ${style.bgHeader} select-none`}>
                    <div className="flex flex-1 items-center gap-1.5 min-w-0">
                      <TriStateCheckbox
                        checked={isAllChecked}
                        indeterminate={isIndeterminate}
                        onChange={() => toggleGroupCheckbox(group.key, groupFiles)}
                        className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                      />
                      <div
                        className="flex flex-1 items-center gap-1 min-w-0 cursor-pointer"
                        onClick={() => toggleGroupExpand(group.key)}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} className={`${style.icon} shrink-0`} />
                        ) : (
                          <ChevronRight size={14} className={`${style.icon} shrink-0`} />
                        )}
                        <span className={`text-[11px] truncate ${style.text}`}>{group.label}</span>
                      </div>
                    </div>
                    <span className="bg-muted ml-2 px-1.5 py-0.5 rounded font-mono text-[9px] text-muted-foreground">
                      {groupFiles.filter((f) => selectedFiles[f.id]).length}/{groupFiles.length}
                    </span>
                  </div>

                  {isExpanded && (
                    <div className="space-y-1 bg-background/40 p-1">
                      {groupFiles.map((file) => {
                        const fileSizeKb = (((file as any).size || (file as any).content?.length || 0) / 1024).toFixed(1);

                        return (
                          <div
                            key={file.id}
                            className="flex justify-between items-center hover:bg-muted/50 px-2 py-1 rounded transition-colors"
                          >
                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={!!selectedFiles[file.id]}
                                onChange={() => toggleFileCheckbox(file.id)}
                                className="rounded w-3.5 h-3.5 text-primary cursor-pointer shrink-0"
                              />
                              <span
                                className={`truncate text-[11px] cursor-pointer ${
                                  selectedFiles[file.id] ? 'font-semibold text-foreground' : 'text-muted-foreground line-through'
                                }`}
                                onClick={() => toggleFileCheckbox(file.id)}
                              >
                                {file.name}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 ml-2 shrink-0">
                              <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] text-muted-foreground">
                                {file.language || 'unknown'}
                              </span>
                              <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[9px] text-muted-foreground">
                                {fileSizeKb} KB
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  const bottomContent = (
    <div className="space-y-2 mt-2 w-full">
      <div className="space-y-3 bg-card p-4 border border-border rounded-lg w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-primary" />
            <h4 className="font-mono font-bold text-foreground text-xs uppercase tracking-wider">
              Selected Files Context
            </h4>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-4 text-center">
          <div className="bg-orange-500/10 p-2 border border-orange-500/20 rounded">
            <span className="block text-[9px] text-orange-500 truncate uppercase">Selected</span>
            <span className="font-bold text-orange-500 text-xs">{selectedCount}</span>
          </div>
          <div className="bg-indigo-500/10 p-2 border border-indigo-500/20 rounded">
            <span className="block text-[9px] text-indigo-500 truncate uppercase">Upstream</span>
            <span className="font-bold text-indigo-500 text-xs">{selectedUpstreamCount}</span>
          </div>
          <div className="bg-blue-500/10 p-2 border border-blue-500/20 rounded">
            <span className="block text-[9px] text-blue-500 truncate uppercase">Downstream</span>
            <span className="font-bold text-blue-500 text-xs">{selectedDownstreamCount}</span>
          </div>

          <div className="bg-emerald-500/10 p-2 border border-emerald-500/20 rounded">
            <span className="block text-[9px] text-emerald-500 truncate uppercase">Token Size</span>
            <span className="font-bold text-emerald-500 text-xs">{(combinedSelectedFilesContext.length / 1024).toFixed(1)} KB</span>
          </div>
        </div>
      </div>

      <div className="bg-background pt-2 w-full">
        <FilesCtxExportPanel targetFilePaths={targetFilePaths} handleCopy={handleCopy} />
      </div>
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="files-context-panel"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
      className="h-full font-mono text-xs animate-in duration-200 fade-in"
    />
  );
}
EOF

# 4e. use-inspector-panel.ts
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/use-inspector-panel.ts
import { useMemo } from 'react';
import {
  CodebaseData,
  CodebaseFile,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';

const VISIBILITY_ORDER = ['public', 'protected', 'package', 'private'];

export function useInspectorPanel(selectedEntity: SelectedEntity | null, initialCodebase: CodebaseData) {
  const currentFile = useMemo(() => {
    if (!selectedEntity) return null;
    return initialCodebase.files.find((f: CodebaseFile) => f.id === selectedEntity.nodeId) || null;
  }, [selectedEntity, initialCodebase.files]);

  const selectedMethod = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== 'member' || !currentFile) return null;
    return currentFile.methods?.find((m: CodebaseMethod) => m.id === selectedEntity.memberId) || null;
  }, [selectedEntity, currentFile]);

  const selectedProp = useMemo(() => {
    if (!selectedEntity || selectedEntity.type !== 'member' || !currentFile) return null;
    return currentFile.configProperties?.find((p: ConfigProperty) => p.key === selectedEntity.memberId) || null;
  }, [selectedEntity, currentFile]);

  const groupedAttributes = useMemo(() => {
    if (!currentFile?.attributes || currentFile.attributes.length === 0) return {};
    const groups: Record<string, CodebaseAttribute[]> = {};
    currentFile.attributes.forEach((attr) => {
      const vis = attr.visibility || 'public';
      if (!groups[vis]) groups[vis] = [];
      groups[vis].push(attr);
    });
    return groups;
  }, [currentFile]);

  const sortedVisibilities = useMemo(() => {
    const keys = Object.keys(groupedAttributes);
    return keys.sort((a, b) => {
      const idxA = VISIBILITY_ORDER.indexOf(a);
      const idxB = VISIBILITY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [groupedAttributes]);

  return {
    currentFile,
    selectedMethod,
    selectedProp,
    groupedAttributes,
    sortedVisibilities,
  };
}
EOF

# 4f. inspector-panel.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/inspector-panel.tsx
import React from 'react';
import {
  FileCode,
  ShieldAlert,
  Fingerprint,
  Tag,
  Code2,
  Layers,
  Hash,
  Settings,
  ListTree,
  Braces,
  Puzzle,
  Boxes,
  Box
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CodebaseData,
  SelectedEntity,
  CodebaseMethod,
  CodebaseAttribute,
  ConfigProperty,
} from '@/shared/services/graph-rag-explorer';
import { useInspectorPanel } from './use-inspector-panel';

interface InspectorPanelProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream?: boolean;
  setEnableDownstream?: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream?: boolean;
  setEnableUpstream?: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet?: Set<string>;
  handleCopy?: (text: string, message: string) => void;
}

export function InspectorPanel({
  selectedEntity,
  initialCodebase,
}: InspectorPanelProps) {
  const {
    currentFile,
    selectedMethod,
    selectedProp,
    groupedAttributes,
    sortedVisibilities,
  } = useInspectorPanel(selectedEntity, initialCodebase);

  if (!selectedEntity || !currentFile) {
    return (
      <div className="py-8 text-muted-foreground text-center">
        <ShieldAlert size={32} className="opacity-40 mx-auto mb-2 text-muted-foreground" />
        <h4 className="font-mono font-bold text-sm">No Active Entity Inspected</h4>
        <p className="mx-auto mt-1 max-w-[240px] text-muted-foreground text-xs">
          Click any graph node, member handle, or tree item to inspect structural properties.
        </p>
      </div>
    );
  }

  const renderTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Puzzle className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'module': return <Boxes className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'interface': return <Braces className="w-4 h-4 text-indigo-400 shrink-0" />;
      case 'class': return <Box className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'config': return <Settings className="w-4 h-4 text-amber-400 shrink-0" />;
      default: return <FileCode className="w-4 h-4 text-slate-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-2.5 font-mono text-xs animate-in duration-200 fade-in">
      <div className="space-y-2 bg-primary/5 p-3 border border-primary/20 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="font-mono font-bold text-[10px] text-primary uppercase tracking-wider">
            ACTIVE SUBSYSTEM
          </span>
          <span className="bg-primary/10 px-2 py-0.5 rounded font-mono font-bold text-[11px] text-primary">
            {currentFile.language}
          </span>
        </div>
        <div className="flex items-start gap-2 mt-2">
          {renderTypeIcon(currentFile.type)}
          <div className="overflow-hidden">
            <h4 className="font-mono font-bold text-foreground text-xs truncate">
              {selectedEntity.type === 'member' ? `${currentFile.name} ➔ ${selectedEntity.memberId}` : currentFile.name}
            </h4>
            <span className="block mt-0.5 font-mono text-[10px] text-muted-foreground truncate">
              {currentFile.path}
            </span>
          </div>
        </div>

        <div className="gap-2 grid grid-cols-2 pt-2 border-border border-t">
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block font-mono text-[9px] text-muted-foreground uppercase">Volume of Code</span>
            <span className="font-mono font-bold text-[11px] text-foreground">{currentFile.size || 0} LOC</span>
          </div>
          <div className="bg-background p-1.5 border border-border rounded">
            <span className="block font-mono text-[9px] text-muted-foreground uppercase">Complexity V(g)</span>
            <span className="font-mono font-bold text-[11px] text-foreground">Level {currentFile.complexity || 1}</span>
          </div>
        </div>

        <div className="bg-slate-950 mt-2 p-2 border border-slate-800 rounded min-h-[60px] max-h-[250px] overflow-auto font-mono text-slate-300 text-xs resize-y">
          <div className="top-0 sticky bg-slate-950/90 backdrop-blur-xs mb-1 py-0.5 font-bold text-[9px] text-amber-400 uppercase select-none">
            Functional Documentation:
          </div>
          <div className="text-[11px] leading-relaxed whitespace-pre-wrap">
            {selectedMethod?.description || selectedProp?.value || (
              `File container (${currentFile.type}) encapsulating polyglot AST architecture layers at ${currentFile.path}.`
            )}
          </div>
        </div>
      </div>

      <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
        <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-primary shrink-0" />
              <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Identity Attributes
              </CardTitle>
            </div>
            <span className="bg-primary/10 px-1.5 py-0.5 rounded-full font-mono font-semibold text-[9px] text-primary uppercase">
              {selectedEntity.type}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-1.5 p-2 font-mono text-[11px]">
          <div className="space-y-1 bg-muted/30 p-1.5 border border-border/40 rounded-md">
            <div className="flex items-center gap-1 font-semibold text-[9px] text-muted-foreground uppercase">
              <Hash className="w-3 h-3 text-primary" /> FQN Identifier
            </div>
            <div className="bg-background/80 p-1 border border-border/30 rounded font-medium text-[11px] text-foreground break-all">
              {selectedEntity.nodeId}
            </div>
          </div>

          <div className="gap-1.5 grid grid-cols-2">
            <div className="bg-muted/20 p-1.5 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
                <Tag className="w-3 h-3 text-amber-500" /> Entity Type
              </span>
              <span className="block mt-0.5 font-bold text-[11px] text-foreground uppercase">
                {currentFile.type}
              </span>
            </div>

            <div className="bg-muted/20 p-1.5 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
                <Layers className="w-3 h-3 text-indigo-500" /> Target Member
              </span>
              <span className="block mt-0.5 font-bold text-[11px] text-foreground truncate">
                {selectedEntity.memberId ? `${selectedEntity.memberId}` : 'N/A'}
              </span>
            </div>
          </div>

          {selectedEntity.edgeId && (
            <div className="bg-muted/20 p-1.5 border border-border/30 rounded">
              <span className="block flex items-center gap-1 text-[9px] text-muted-foreground uppercase">
                <Code2 className="w-3 h-3 text-emerald-500" /> Edge ID
              </span>
              <span className="block mt-0.5 font-bold text-[11px] text-foreground break-all">
                {selectedEntity.edgeId}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {currentFile.type === 'config' ? (
        <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
          <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
            <div className="flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                Config Properties ({currentFile.configProperties?.length || 0})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-2">
            {(!currentFile.configProperties || currentFile.configProperties.length === 0) ? (
              <span className="text-muted-foreground text-xs italic">No properties mapped</span>
            ) : (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {currentFile.configProperties.map((prop: ConfigProperty, idx: number) => {
                  const isSelected = selectedEntity.memberId === prop.key;
                  return (
                    <div
                      key={idx}
                      className={`p-1.5 rounded border font-mono text-[11px] ${
                        isSelected ? 'border-amber-500 bg-amber-500/10 font-bold' : 'border-border/40 bg-muted/20'
                      }`}
                    >
                      <span className="block font-semibold text-amber-500">{prop.key}</span>
                      <span className="block text-muted-foreground truncate">{prop.value}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
            <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
              <div className="flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-primary shrink-0" />
                <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                  Attributes / Fields ({currentFile.attributes?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {sortedVisibilities.length === 0 ? (
                <span className="text-muted-foreground text-xs italic">No attributes declared</span>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {sortedVisibilities.map((vis) => (
                    <div key={vis} className="space-y-0.5">
                      <div className="px-0.5 font-bold text-[9px] text-muted-foreground uppercase tracking-wider">
                        {vis}
                      </div>
                      <div className="space-y-0.5">
                        {groupedAttributes[vis].map((attr: CodebaseAttribute, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 bg-muted/20 px-1.5 py-0.5 border border-border/30 rounded text-[11px]"
                          >
                            <span className="bg-primary/10 px-1 py-0.2 rounded font-bold text-[9px] text-primary uppercase shrink-0">
                              {attr.visibility}
                            </span>
                            <span className="font-semibold text-foreground truncate">{attr.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card/50 shadow-xs border-border overflow-hidden">
            <CardHeader className="bg-muted/40 p-2 border-border/60 border-b">
              <div className="flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <CardTitle className="font-mono font-bold text-[11px] text-foreground uppercase tracking-wider">
                  Methods / Exports ({currentFile.methods?.length || 0})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-2">
              {(!currentFile.methods || currentFile.methods.length === 0) ? (
                <span className="text-muted-foreground text-xs italic">No methods declared</span>
              ) : (
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {currentFile.methods.map((m: CodebaseMethod) => {
                    const isSelected = selectedEntity.memberId === m.id;
                    return (
                      <div
                        key={m.id}
                        className={`p-1 rounded border text-[11px] ${
                          isSelected ? 'border-indigo-500 bg-indigo-500/10 font-bold' : 'border-border/30 bg-muted/20'
                        }`}
                      >
                        <span
                          className="block font-semibold text-foreground truncate cursor-help"
                          data-tooltip={m.signature || ''}
                        >
                          + {m.name}
                        </span>
                        {m.description && (
                          <span className="block mt-0.5 text-[10px] text-muted-foreground leading-snug">
                            {m.description}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
EOF

# 4g. use-tabs-files-context.ts
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/use-tabs-files-context.ts
import { useExplorerStore } from '../store/useExplorerStore';

export function useTabsFilesContext() {
  const rightPanelTab = useExplorerStore((s) => s.rightPanelTab);
  const setRightPanelTab = useExplorerStore((s) => s.setRightPanelTab);

  return {
    rightPanelTab,
    setRightPanelTab,
  };
}
EOF

# 4h. tabs-files-context-container.tsx
cat << 'EOF' > webview/src/features/explorer/wkp-rgt-tabs-files-context/tabs-files-context-container.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { InspectorPanel } from './inspector-panel';
import { FilesContextPanel } from './files-context';
import { ContextTransformerPanel } from './context-transformer';
import { CodebaseData, SelectedEntity } from '@/shared/services/graph-rag-explorer';
import { useTabsFilesContext } from './use-tabs-files-context';

interface TabsFilesContextContainerProps {
  selectedEntity: SelectedEntity | null;
  initialCodebase: CodebaseData;
  enableDownstream: boolean;
  setEnableDownstream: React.Dispatch<React.SetStateAction<boolean>>;
  enableUpstream: boolean;
  setEnableUpstream: React.Dispatch<React.SetStateAction<boolean>>;
  impactedSet: Set<string>;
  handleCopy: (text: string, message: string) => void;
}

export function TabsFilesContextContainer({
  selectedEntity,
  initialCodebase,
  enableDownstream,
  setEnableDownstream,
  enableUpstream,
  setEnableUpstream,
  impactedSet,
  handleCopy
}: TabsFilesContextContainerProps) {
  const { rightPanelTab, setRightPanelTab } = useTabsFilesContext();

  return (
    <div className="flex flex-col bg-card h-full">
      <div className="flex bg-muted/40 border-border border-b overflow-x-auto shrink-0">
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('inspect')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'inspect' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Inspector
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('files_context')}
          className={`flex-1 min-w-[70px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'files_context' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Context
        </Button>
        <Button
          variant="ghost"
          onClick={() => setRightPanelTab('transformer')}
          className={`flex-1 min-w-[80px] py-2 text-[11px] font-bold rounded-none border-b-2 ${rightPanelTab === 'transformer' ? 'border-b-primary text-primary bg-background' : 'text-muted-foreground border-transparent'}`}
        >
          Transformer
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto text-xs">
        {rightPanelTab === 'files_context' && (
          <FilesContextPanel
            initialCodebase={initialCodebase}
            selectedEntity={selectedEntity}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'transformer' && (
          <ContextTransformerPanel
            initialCodebase={initialCodebase}
            handleCopy={handleCopy}
          />
        )}
        {rightPanelTab === 'inspect' && (
          <InspectorPanel
            selectedEntity={selectedEntity}
            initialCodebase={initialCodebase}
            enableDownstream={enableDownstream}
            setEnableDownstream={setEnableDownstream}
            enableUpstream={enableUpstream}
            setEnableUpstream={setEnableUpstream}
            impactedSet={impactedSet}
            handleCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
}
EOF

# ============================================================================
# 5. wksp-cnt-graph hooks & components
# ============================================================================

# 5a. use-graph-panel.ts
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/use-graph-panel.ts
import { useMemo } from 'react';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';

export function useGraphPanel(
  folderPositions: Record<string, { label: string }>,
  nodePositions: Record<string, { x: number; y: number; w: number; h: number }>,
  showSelectedOnly: boolean,
  selectedEntity: SelectedEntity | null,
  searchFilteredFiles: CodebaseFile[],
  impactedSet: Set<string>
) {
  const effectiveFolderPositions = useMemo(() => {
    const folderMap: Record<string, { label: string }> = { ...folderPositions };

    Object.keys(nodePositions).forEach((nodeKey) => {
      if (nodeKey.startsWith('folder__')) {
        const folderKey = nodeKey.replace('folder__', '');
        if (!folderMap[folderKey]) {
          folderMap[folderKey] = {
            label: `📂 ${folderKey.charAt(0).toUpperCase() + folderKey.slice(1)}`
          };
        }
      }
    });

    return folderMap;
  }, [folderPositions, nodePositions]);

  const effectiveSearchFilteredFiles = useMemo(() => {
    if (showSelectedOnly && selectedEntity) {
      return searchFilteredFiles.filter(f => f.id === selectedEntity.nodeId || impactedSet.has(f.id));
    }
    return searchFilteredFiles;
  }, [searchFilteredFiles, showSelectedOnly, selectedEntity, impactedSet]);

  return {
    effectiveFolderPositions,
    effectiveSearchFilteredFiles,
  };
}
EOF

# 5b. GraphPanel.tsx
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanel.tsx
import React from 'react';
import { Info } from 'lucide-react';
import { FolderNode, UmlClassNode, ConfigNode, UmlClassNodeData } from './components/graph/GraphUmlShapes';
import { SelectedEntity, CodebaseFile } from '@/shared/services/graph-rag-explorer';
import { isMemberKeyForFileToken, extractMemberIdFromKeyToken } from '@/services/view/graph-view.service';
import { useGraphPanel } from './use-graph-panel';

interface GraphPanelProps {
  folderPositions: Record<string, { label: string }>;
  containerRef: (node: HTMLDivElement | null) => void;
  showGrid: boolean;
  isDarkMode: boolean;
  graphState: {
    zoom: number;
    pan: { x: number; y: number };
    nodePositions: Record<string, { x: number; y: number; w: number; h: number }>;
  };
  selectedEntity: SelectedEntity | null;
  focusedNodeId?: string | null;
  searchFilteredFiles: CodebaseFile[];
  impactedSet: Set<string>;
  handleSelectMember: (nodeId: string, memberId: string) => void;
  attributesVisible: boolean;
  methodsVisible: boolean;
  showSelectedOnly?: boolean;
}

export function GraphPanel({
  folderPositions,
  containerRef,
  showGrid,
  isDarkMode,
  graphState,
  selectedEntity,
  focusedNodeId,
  searchFilteredFiles,
  impactedSet,
  handleSelectMember,
  attributesVisible,
  methodsVisible,
  showSelectedOnly = false
}: GraphPanelProps) {
  const {
    effectiveFolderPositions,
    effectiveSearchFilteredFiles,
  } = useGraphPanel(
    folderPositions,
    graphState.nodePositions,
    showSelectedOnly,
    selectedEntity,
    searchFilteredFiles,
    impactedSet
  );

  return (
    <div className="absolute inset-0 outline-none w-full h-full overflow-hidden">
      <div
        ref={containerRef}
        className="z-0 absolute inset-0 w-full h-full"
        style={showGrid ? {
          backgroundImage: isDarkMode
            ? 'radial-gradient(#334155 1.2px, transparent 1.2px)'
            : 'radial-gradient(#cbd5e1 1.2px, transparent 1.2px)',
          backgroundSize: `${16 * graphState.zoom}px ${16 * graphState.zoom}px`,
          backgroundPosition: `${graphState.pan.x}px ${graphState.pan.y}px`
        } : undefined}
      />

      <div
        className="z-10 absolute inset-0 origin-top-left pointer-events-none select-none"
        style={{ transform: `translate(${graphState.pan.x}px, ${graphState.pan.y}px) scale(${graphState.zoom})` }}
      >
        {Object.entries(effectiveFolderPositions).map(([folderKey, initialPos]) => {
          const bounds = graphState.nodePositions[`folder__${folderKey}`];
          if (!bounds) return null;
          const isSelected = selectedEntity?.nodeId === `folder__${folderKey}`;
          return (
            <div
              key={`folder-box-${folderKey}`}
              className="z-10 absolute transition-all duration-75 ease-out"
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              <FolderNode data={{ label: initialPos.label }} isSelected={isSelected} />
            </div>
          );
        })}

        {effectiveSearchFilteredFiles.map((file: CodebaseFile) => {
          const bounds = graphState.nodePositions[file.id];
          if (!bounds) return null;

          const impactedMembers: string[] = [];
          impactedSet.forEach(item => {
            if (isMemberKeyForFileToken(item, file.id)) {
              impactedMembers.push(extractMemberIdFromKeyToken(item));
            }
          });

          const isOrigin = selectedEntity?.nodeId === file.id;
          const isDependency = impactedSet.has(file.id) && !isOrigin;
          const isFocused = focusedNodeId === file.id;

          const nodeData: UmlClassNodeData = {
            ...file,
            isOrigin,
            isDependency,
            isFocused,
            impactedMembers,
            selectedMember: selectedEntity?.nodeId === file.id ? selectedEntity?.memberId : undefined,
            onSelectMember: handleSelectMember,
            attributesVisible,
            methodsVisible
          };

          return (
            <div
              key={file.id}
              className={`absolute transition-all duration-75 ease-out pointer-events-none ${isFocused ? 'z-30' : 'z-20'}`}
              style={{ left: bounds.x, top: bounds.y, width: bounds.w, height: bounds.h }}
            >
              {file.type === 'config' ? (
                <ConfigNode id={file.id} data={nodeData} />
              ) : (
                <UmlClassNode id={file.id} data={nodeData} />
              )}
            </div>
          );
        })}
      </div>

      <div
        id="cytoscape-engine-info"
        className="top-4 left-4 z-20 absolute bg-card/90 shadow-md backdrop-blur p-3 border border-border rounded-lg max-w-sm font-mono text-xs pointer-events-auto"
      >
        <div className="flex justify-between items-center gap-2 mb-1">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-primary" />
            <span className="font-bold">Surgical Analysis (Cytoscape Engine)</span>
          </div>
          <button
            onClick={() => {
              const infoDiv = document.getElementById('cytoscape-engine-info');
              if (infoDiv) infoDiv.style.display = 'none';
            }}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Drag-and-drop on headers and wheel zoom use Cytoscape's responsive architecture.
        </p>
      </div>
    </div>
  );
}
EOF

# 5c. use-graph-panel-header.ts
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/use-graph-panel-header.ts
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vscodeSettings } from '@/App';

export function useGraphPanelHeader(cyRef?: React.RefObject<any>) {
  const displayNeo4jHandler = () => {
    vsCodeApiService.openUrl(vscodeSettings.graphRagExplorer.neo4j.url, true);
  };

  const handleZoomIn = () => {
    cyRef?.current?.zoom((cyRef.current?.zoom() || 1) * 1.2);
  };

  const handleZoomOut = () => {
    cyRef?.current?.zoom((cyRef.current?.zoom() || 1) / 1.2);
  };

  const handleFitView = () => {
    cyRef?.current?.fit(undefined, 40);
    cyRef?.current?.center();
  };

  return {
    displayNeo4jHandler,
    handleZoomIn,
    handleZoomOut,
    handleFitView,
  };
}
EOF

# 5d. GraphPanelHeader.tsx
cat << 'EOF' > webview/src/features/explorer/wksp-cnt-graph/GraphPanelHeader.tsx
import React from 'react';
import { Grid, Database, User, Baby, Plus, Minus, Focus, SquareFunction, Code2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SelectFromTypeBuilder } from '@/components/app/ui-utils';
import { ToggleButton } from '@/components/app/toggle-button';
import { ToolbarSeparator } from '@/components/app/toolbar-separator';

import {
  DISPLAY_LEVEL_LIST,
  DISPLAY_LEVEL_ICON_MAP,
  GRAPH_LAYOUT_LIST,
  GRAPH_LAYOUT_ICON_MAP
} from '@/shared/services/graph-rag-explorer/domain/model/types';
import { useGraphPanelHeader } from './use-graph-panel-header';

export interface GraphPanelHeaderLeftProps {}

export const GraphPanelHeaderLeft: React.FC<GraphPanelHeaderLeftProps> = () => (
  <div className="flex items-center gap-2">
    <span className="font-bold text-foreground truncate uppercase tracking-wider">Topological Network</span>
  </div>
);

export interface GraphPanelHeaderCenterProps {
  maxNodesLimit: number;
  setMaxNodesLimit: (val: number) => void;
  callersDepth: number;
  setCallersDepth: (val: number) => void;
  calleesDepth: number;
  setCalleesDepth: (val: number) => void;
  displayLevel: string;
  setDisplayLevel: (val: string) => void;
  currentLayout: string;
  setCurrentLayout: (val: string) => void;
}

export const GraphPanelHeaderCenter: React.FC<GraphPanelHeaderCenterProps> = ({
  maxNodesLimit,
  setMaxNodesLimit,
  callersDepth,
  setCallersDepth,
  calleesDepth,
  setCalleesDepth,
  displayLevel,
  setDisplayLevel,
  currentLayout,
  setCurrentLayout,
}) => {
  const { displayNeo4jHandler } = useGraphPanelHeader();

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 bg-background px-2 py-0.5 border border-border rounded-sm h-6">
        <span className="font-medium text-[10px] text-muted-foreground uppercase tracking-wider">Limit:</span>
        <Input
          id="input-max-nodes-limit"
          type="number"
          min={1}
          max={100}
          className="bg-transparent shadow-none px-1 border-0 focus:ring-0 w-12 h-5 font-bold text-foreground text-xs text-center"
          value={maxNodesLimit}
          onChange={(e) => setMaxNodesLimit(Number(e.target.value) || 50)}
        />
      </div>
      <Button
        id="btn-neo4j-connect"
        className="flex items-center gap-1.5 bg-gradient-to-r from-orange-600 to-orange-500 shadow-sm px-2.5 border border-orange-700 rounded-md h-6 font-bold text-[10px] text-white uppercase tracking-wider"
        onClick={displayNeo4jHandler}
      >
        <Database size={11} /> Neo4j
      </Button>
      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm h-6">
        <User size={12} className="text-muted-foreground" />
        <Input
          id="input-callers-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
          value={callersDepth}
          onChange={(e) => setCallersDepth(Number(e.target.value) || 0)}
        />
      </div>
      <div className="flex items-center gap-1 bg-background px-1.5 py-0.5 border border-border rounded-sm h-6">
        <Baby size={12} className="text-muted-foreground" />
        <Input
          id="input-callees-depth"
          type="number"
          min={0}
          max={20}
          className="bg-transparent p-0 border-0 focus:ring-0 w-8 h-5 text-foreground text-xs text-center"
          value={calleesDepth}
          onChange={(e) => setCalleesDepth(Number(e.target.value) || 0)}
        />
      </div>
      <SelectFromTypeBuilder
        id="select-display-level"
        value={displayLevel}
        onChange={setDisplayLevel}
        className="py-0"
        triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
        options={DISPLAY_LEVEL_LIST.map((key) => ({
          value: key,
          icon: DISPLAY_LEVEL_ICON_MAP[key].icon,
          label: DISPLAY_LEVEL_ICON_MAP[key].label,
        }))}
      />
      <SelectFromTypeBuilder
        id="select-graph-layout"
        value={currentLayout}
        onChange={setCurrentLayout}
        className="py-0"
        triggerClassName="!h-6 min-h-0 py-0 px-2 text-xs border-border rounded-sm font-mono"
        options={GRAPH_LAYOUT_LIST.map((key) => ({
          value: key,
          icon: GRAPH_LAYOUT_ICON_MAP[key].icon,
          label: GRAPH_LAYOUT_ICON_MAP[key].label,
        }))}
      />
    </div>
  );
};

export interface GraphPanelHeaderRightProps {
  cyRef: React.RefObject<any>;
  isGraphMaximized: boolean;
  setIsGraphMaximized: (maximized: boolean) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  attributesVisible: boolean;
  setAttributesVisible: (val: boolean) => void;
  methodsVisible: boolean;
  setMethodsVisible: (val: boolean) => void;
  showSelectedOnly: boolean;
  setShowSelectedOnly: (val: boolean) => void;
}

export const GraphPanelHeaderRight: React.FC<GraphPanelHeaderRightProps> = ({
  cyRef,
  isGraphMaximized,
  setIsGraphMaximized,
  showGrid,
  setShowGrid,
  attributesVisible,
  setAttributesVisible,
  methodsVisible,
  setMethodsVisible,
  showSelectedOnly,
  setShowSelectedOnly,
}) => {
  const { handleZoomIn, handleZoomOut, handleFitView } = useGraphPanelHeader(cyRef);

  return (
    <div className="flex items-center gap-1">
      <ToggleButton
        id="btn-toggle-show-selected-only"
        isSelected={showSelectedOnly}
        onToggle={() => setShowSelectedOnly(!showSelectedOnly)}
        tooltipText="Display Only Selected & Connected Items"
        icon={<Target size={12} />}
      />
      <ToggleButton
        id="btn-toggle-attributes-visibility"
        isSelected={attributesVisible}
        onToggle={() => setAttributesVisible(!attributesVisible)}
        tooltipText="Toggle Attributes Visibility"
        icon={<Code2 size={12} />}
      />
      <ToggleButton
        id="btn-toggle-methods-visibility"
        isSelected={methodsVisible}
        onToggle={() => setMethodsVisible(!methodsVisible)}
        tooltipText="Toggle Methods Visibility"
        icon={<SquareFunction size={12} />}
      />

      <ToolbarSeparator />

      <ToggleButton
        id="btn-toggle-grid"
        isSelected={showGrid}
        onToggle={() => setShowGrid(!showGrid)}
        tooltipText="Toggle Grid"
        icon={<Grid size={12} />}
      />

      <ToolbarSeparator />

      <Button
        id="btn-graph-zoom-in"
        variant="ghost"
        size="icon"
        className="w-5 h-5 text-muted-foreground"
        onClick={handleZoomIn}
      >
        <Plus size={12} />
      </Button>
      <Button
        id="btn-graph-zoom-out"
        variant="ghost"
        size="icon"
        className="w-5 h-5 text-muted-foreground"
        onClick={handleZoomOut}
      >
        <Minus size={12} />
      </Button>
      <Button
        id="btn-graph-fit-view"
        variant="ghost"
        size="icon"
        className="w-5 h-5 text-muted-foreground"
        onClick={handleFitView}
      >
        <Focus size={12} />
      </Button>
    </div>
  );
};
EOF

# ============================================================================
# 6. Rationalize webview/src/features/explorer/layout-ctns with new hooks
# ============================================================================

# 6a. TopPanelContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/TopPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { ImpactedPathsPanel } from '../wkp-top-impacted-paths/impacted-paths-panel';
import {
  ImpactedPathsPanelHeaderLeft,
  ImpactedPathsPanelHeaderCenter,
  ImpactedPathsPanelHeaderRight,
} from '../wkp-top-impacted-paths/ImpactedPathsPanelHeader';
import { useExplorerStore } from '../store/useExplorerStore';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function TopPanelContainer() {
  const upstreamDepth = useExplorerStore((s) => s.upstreamDepth);
  const setUpstreamDepth = useExplorerStore((s) => s.setUpstreamDepth);
  const downstreamDepth = useExplorerStore((s) => s.downstreamDepth);
  const setDownstreamDepth = useExplorerStore((s) => s.setDownstreamDepth);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.top"
        headerLeft={<ImpactedPathsPanelHeaderLeft />}
        headerCenter={
          <ImpactedPathsPanelHeaderCenter
            upstreamDepth={upstreamDepth}
            setUpstreamDepth={setUpstreamDepth}
            downstreamDepth={downstreamDepth}
            setDownstreamDepth={setDownstreamDepth}
          />
        }
        headerRight={<ImpactedPathsPanelHeaderRight />}
      />
      <div className="flex-1 min-h-0 overflow-auto">
        <ImpactedPathsPanel
          onCodebaseChange={handleImportCodebase}
          upstreamDepth={upstreamDepth}
          downstreamDepth={downstreamDepth}
        />
      </div>
    </div>
  );
}
EOF

# 6b. LeftPanelContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/LeftPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { CodebaseExplorerPanel } from '../wkp-lft-codebase-tree/CodebaseExplorerPanel';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useExplorerStore } from '../store/useExplorerStore';
import { CodebaseData } from '@/shared/services/graph-rag-explorer';

export function LeftPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const setCodebase = useExplorerStore((s) => s.setCodebase);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const setFocusedNodeId = useExplorerStore((s) => s.setFocusedNodeId);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const filter = useCodebaseFilter(codebase.files);

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      setFocusedNodeId(nodeId);
      setTimeout(() => {
        setFocusedNodeId((prev) => (prev === nodeId ? null : prev));
      }, 2000);
    },
    [setFocusedNodeId]
  );

  const handleImportCodebase = useCallback(
    async (importedData: CodebaseData) => {
      setCodebase(importedData);
      setNotification('AST Codebase imported successfully!');
    },
    [setCodebase, setNotification]
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Codebase Explorer" path="workspace.left" />
      <div className="flex-1 min-h-0 overflow-auto">
        <CodebaseExplorerPanel
          codebase={codebase}
          searchFilteredFiles={filter.searchFilteredFiles}
          expandedFolders={filter.expandedFolders}
          visibleFiles={filter.visibleFiles}
          toggleFolder={filter.toggleFolder}
          toggleFolderCheckbox={filter.toggleFolderCheckbox}
          toggleFileCheckbox={filter.toggleFileCheckbox}
          setSelectedEntity={setSelectedEntity}
          onFocusNode={handleFocusNode}
          onImportCodebase={handleImportCodebase}
        />
      </div>
    </div>
  );
}
EOF

# 6c. CenterPanelContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/CenterPanelContainer.tsx
import React, { useEffect, useCallback } from 'react';
import { useLayoutStore } from '@/store/useLayoutStore';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { vsCodeApiService } from '@/services/api/vs-code-api.service.gen';
import { vsCodeHandleMessage } from '@/services/listener/vscode-message.handler';
import { logInfo } from '@/services/view/log-view.service.wrapper';
import { GraphPanel } from '../wksp-cnt-graph/GraphPanel';
import {
  GraphPanelHeaderLeft,
  GraphPanelHeaderCenter,
  GraphPanelHeaderRight,
} from '../wksp-cnt-graph/GraphPanelHeader';
import { useCodebaseFilter } from '../hooks/use-codebase-filter';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useGraph } from '../wksp-cnt-graph/components/graph/use-graph';
import { useExplorerStore } from '../store/useExplorerStore';

export function CenterPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const folderPositions = useExplorerStore((s) => s.folderPositions);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setSelectedEntity = useExplorerStore((s) => s.setSelectedEntity);
  const focusedNodeId = useExplorerStore((s) => s.focusedNodeId);

  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);

  const showGrid = useExplorerStore((s) => s.showGrid);
  const setShowGrid = useExplorerStore((s) => s.setShowGrid);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const setCallersDepth = useExplorerStore((s) => s.setCallersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setCalleesDepth = useExplorerStore((s) => s.setCalleesDepth);
  const currentLayout = useExplorerStore((s) => s.currentLayout);
  const setCurrentLayout = useExplorerStore((s) => s.setCurrentLayout);

  const attributesVisible = useExplorerStore((s) => s.attributesVisible);
  const setAttributesVisible = useExplorerStore((s) => s.setAttributesVisible);
  const methodsVisible = useExplorerStore((s) => s.methodsVisible);
  const setMethodsVisible = useExplorerStore((s) => s.setMethodsVisible);
  const showSelectedOnly = useExplorerStore((s) => s.showSelectedOnly);
  const setShowSelectedOnly = useExplorerStore((s) => s.setShowSelectedOnly);

  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);

  const filter = useCodebaseFilter(codebase.files);
  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setSelectedEntity({ type: 'node', nodeId });
    },
    [setSelectedEntity]
  );

  const handleSelectMember = useCallback(
    (nodeId: string, memberId: string) => {
      setSelectedEntity({ type: 'member', nodeId, memberId });
    },
    [setSelectedEntity]
  );

  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      if (targetFile && targetFile.path) {
        logInfo(`Double-clicked graph item: ${nodeId}. Revealing path in VS Code Explorer: ${targetFile.path}`);
        vsCodeApiService.revealInExplorer(targetFile.path);
      }
    },
    [codebase.files]
  );

  const handleNodeCmdClick = useCallback(
    (nodeId: string) => {
      const targetFile = codebase.files.find((f) => f.id === nodeId);
      const pathToAdd = targetFile?.path || nodeId;
      logInfo(`Cmd+Clicked graph item: ${nodeId}. Appending path to context paths panel: ${pathToAdd}`);
      vsCodeHandleMessage.emit('addPathToTop', { command: 'addPathToTop', payload: pathToAdd });
    },
    [codebase.files]
  );

  const { containerRef, cyRef, graphState, updateGraphTopology, isReady } = useGraph(
    isDarkMode,
    handleNodeSelect,
    handleNodeDoubleClick,
    handleNodeCmdClick
  );

  useEffect(() => {
    if (!isReady || Object.keys(folderPositions).length === 0) return;
    updateGraphTopology(
      filter.searchFilteredFiles,
      filter.visibleFiles,
      codebase,
      impactedSet,
      currentLayout,
      folderPositions,
      attributesVisible,
      methodsVisible,
      selectedEntity,
      showSelectedOnly
    );
  }, [
    isReady,
    filter.searchFilteredFiles,
    filter.visibleFiles,
    codebase,
    impactedSet,
    currentLayout,
    folderPositions,
    attributesVisible,
    methodsVisible,
    selectedEntity,
    showSelectedOnly,
    updateGraphTopology,
  ]);

  return (
    <div className="relative flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader
        path="workspace.center"
        isHiddable={true}
        headerLeft={<GraphPanelHeaderLeft />}
        headerCenter={
          <GraphPanelHeaderCenter
            maxNodesLimit={filter.maxNodesLimit}
            setMaxNodesLimit={filter.setMaxNodesLimit}
            callersDepth={callersDepth}
            setCallersDepth={setCallersDepth}
            calleesDepth={calleesDepth}
            setCalleesDepth={setCalleesDepth}
            displayLevel={filter.displayLevel}
            setDisplayLevel={filter.setDisplayLevel}
            currentLayout={currentLayout}
            setCurrentLayout={setCurrentLayout}
          />
        }
        headerRight={
          <GraphPanelHeaderRight
            cyRef={cyRef}
            isGraphMaximized={false}
            setIsGraphMaximized={() => toggleContainerMaximized('workspace.center')}
            showGrid={showGrid}
            setShowGrid={setShowGrid}
            attributesVisible={attributesVisible}
            setAttributesVisible={setAttributesVisible}
            methodsVisible={methodsVisible}
            setMethodsVisible={setMethodsVisible}
            showSelectedOnly={showSelectedOnly}
            setShowSelectedOnly={setShowSelectedOnly}
          />
        }
      />
      <div className="relative flex-1 w-full h-full min-h-0">
        <GraphPanel
          folderPositions={folderPositions}
          containerRef={containerRef}
          showGrid={showGrid}
          isDarkMode={isDarkMode}
          graphState={graphState}
          selectedEntity={selectedEntity}
          focusedNodeId={focusedNodeId}
          searchFilteredFiles={filter.searchFilteredFiles}
          impactedSet={impactedSet}
          handleSelectMember={handleSelectMember}
          attributesVisible={attributesVisible}
          methodsVisible={methodsVisible}
          showSelectedOnly={showSelectedOnly}
        />
      </div>
    </div>
  );
}
EOF

# 6d. RightPanelContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/RightPanelContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { TabsFilesContextContainer } from '../wkp-rgt-tabs-files-context/tabs-files-context-container';
import { useTransitiveImpact } from '../hooks/use-transitive-impact';
import { useExplorerStore } from '../store/useExplorerStore';

export function RightPanelContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const enableDownstream = useExplorerStore((s) => s.enableDownstream);
  const setEnableDownstream = useExplorerStore((s) => s.setEnableDownstream);
  const enableUpstream = useExplorerStore((s) => s.enableUpstream);
  const setEnableUpstream = useExplorerStore((s) => s.setEnableUpstream);
  const callersDepth = useExplorerStore((s) => s.callersDepth);
  const calleesDepth = useExplorerStore((s) => s.calleesDepth);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const { impactedSet } = useTransitiveImpact(
    selectedEntity,
    codebase.dependencies,
    callersDepth,
    calleesDepth,
    enableDownstream,
    enableUpstream
  );

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Files Context Builder" path="workspace.right" />
      <div className="flex-1 min-h-0 overflow-auto">
        <TabsFilesContextContainer
          selectedEntity={selectedEntity}
          initialCodebase={codebase}
          enableDownstream={enableDownstream}
          setEnableDownstream={setEnableDownstream}
          enableUpstream={enableUpstream}
          setEnableUpstream={setEnableUpstream}
          impactedSet={impactedSet}
          handleCopy={handleCopy}
        />
      </div>
    </div>
  );
}
EOF

# 6e. BottomPanelContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/BottomPanelContainer.tsx
import React from 'react';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { WkpBottomPanel } from '../wkp-btm-infos/wkp-bottom-panel';

export function BottomPanelContainer() {
  return (
    <div className="flex flex-col bg-background w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Output & Logs" path="workspace.bottom" />
      <div className="flex-1 min-h-0 overflow-auto">
        <WkpBottomPanel />
      </div>
    </div>
  );
}
EOF

# 6f. SidebarRightContainer.tsx
cat << 'EOF' > webview/src/features/explorer/layout-ctns/SidebarRightContainer.tsx
import React, { useCallback } from 'react';
import { useAppContextStore } from '@/store/useAppContextStore';
import { ContainerPanelHeader } from '@/components/app/layout/ContainerPanelHeader';
import { TabsPromptContainer } from '../sdb-rgt-prompt/tabs-prompt-container';
import { useExplorerStore } from '../store/useExplorerStore';

export function SidebarRightContainer() {
  const codebase = useExplorerStore((s) => s.codebase);
  const selectedEntity = useExplorerStore((s) => s.selectedEntity);
  const setNotification = useAppContextStore((s) => s.setNotification);

  const handleCopy = useCallback(
    (text: string, message: string) => {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      }
      setNotification(message);
    },
    [setNotification]
  );

  return (
    <div className="flex flex-col bg-card w-full min-w-0 h-full min-h-0 overflow-hidden">
      <ContainerPanelHeader title="Prompt & LLM Studio" path="sidebarRight" />
      <div className="flex-1 min-h-0 overflow-auto">
        <TabsPromptContainer
          selectedEntity={selectedEntity}
          initialCodebase={codebase}
          handleCopy={handleCopy}
        />
      </div>
    </div>
  );
}
EOF

echo "✅ refactor: Externalized logic into conventional React hooks next to components and rationalized layout containers!"

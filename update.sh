#!/usr/bin/env bash
set -e

echo "🚀 Updating token formatting in LLM Chat View..."

# ==============================================================================
# Step 1: Update Webview React UI Component (LLM.tsx)
# ==============================================================================
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/LLM.tsx
import React, { useState, useEffect } from 'react';
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

const formatExecutionTime = (timeMs?: number): string => {
  if (!timeMs || timeMs < 0) return '00m:00s';
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`;
};

const formatDateTime = (timestamp?: number): string => {
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
};

const formatTokenCount = (count?: number): string => {
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
};

const formatPromptWithContext = (instruction: string, files: IFileContextDto[]): string => {
  if (!files || files.length === 0) {
    return instruction;
  }

  const fileBlocks = files
    .map((f) => `  <file path="${f.path}">\n${f.content || '// Content unavailable'}\n  </file>`)
    .join('\n');

  return `<context>\n${fileBlocks}\n</context>\n\n<instruction>\n  ${instruction}\n</instruction>`;
};

const parseUserMessageContent = (content: string) => {
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
};

const CopyButton: React.FC<{ text: string; title?: string }> = ({ text, title = 'Copy content' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logInfo('Failed to copy text', err);
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
        border: '1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.3))',
        borderRadius: '6px',
        backgroundColor: 'var(--vscode-editor-background, rgba(0, 0, 0, 0.15))',
        overflow: 'hidden',
      }}
    >
      {/* Sub-Card Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: 'var(--vscode-sideBarSectionHeader-background, rgba(128, 128, 128, 0.12))',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isOpen ? '1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.2))' : 'none',
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
                background: 'var(--vscode-badge-background)',
                color: 'var(--vscode-badge-foreground)',
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

      {/* Sub-Card Body */}
      {isOpen && (
        <div
          style={{
            padding: '8px 10px',
            fontSize: '0.85em',
            lineHeight: '1.4',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily: 'var(--vscode-editor-font-family, monospace)',
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

  const userBg = 'var(--vscode-inputValidation-infoBackground, rgba(14, 99, 156, 0.12))';
  const userBorder = 'var(--vscode-inputValidation-infoBorder, rgba(14, 99, 156, 0.35))';

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
        color: 'var(--vscode-foreground)',
        padding: '8px 12px',
        borderRadius: '8px',
        border: `1px solid ${userBorder}`,
      }}
    >
      {/* Sticky Header Bar */}
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

      {/* Expandable Content Body */}
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

      {/* Footer Metadata (ALWAYS visible even if block is collapsed) */}
      <div
        style={{
          fontSize: '0.7em',
          opacity: 0.7,
          textAlign: 'right',
          marginTop: '4px',
          borderTop: isBlockExpanded ? '1px dashed var(--vscode-panel-border, rgba(128, 128, 128, 0.3))' : 'none',
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
  const bubbleBg = 'var(--vscode-editor-inactiveSelectionBackground, rgba(128, 128, 128, 0.15))';
  const bubbleBorder = '1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.3))';

  return (
    <div
      style={{
        alignSelf: 'flex-start',
        backgroundColor: bubbleBg,
        color: 'var(--vscode-editor-foreground, var(--vscode-foreground))',
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
      {/* Sticky Header Bar */}
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
          borderBottom: isBlockExpanded ? '1px dotted var(--vscode-panel-border)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{isBlockExpanded ? '▼' : '►'}</span>
          <span>🤖 {(msg.provider || fallbackProvider).toUpperCase()} ({msg.model || fallbackModel})</span>
        </div>
        <CopyButton text={msg.content} title="Copy assistant response" />
      </div>

      {/* Content Body */}
      {isBlockExpanded && <div>{msg.content}</div>}

      {/* Footer Metadata (ALWAYS visible even if block is collapsed) */}
      {(msg.promptTokens !== undefined || msg.executionTimeMs !== undefined) && (
        <div
          style={{
            fontSize: '0.7em',
            opacity: 0.65,
            textAlign: 'right',
            marginTop: '6px',
            borderTop: isBlockExpanded ? '1px dashed var(--vscode-panel-border, rgba(128, 128, 128, 0.3))' : 'none',
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
  const [provider, setProvider] = useState<LlmProvider>(LlmProvider.OLLAMA);
  const [models, setModels] = useState<ILlmModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [messages, setMessages] = useState<IChatMessageDto[]>([]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [systemPrompt] = useState<string>('You are an expert Graph RAG Assistant.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [temperature, setTemperature] = useState<number>(0.7);

  // File Context state
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

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', fontFamily: 'var(--vscode-font-family, sans-serif)', color: 'var(--vscode-foreground)' }}>
      {/* Header controls */}
      <header style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid var(--vscode-panel-border)', paddingBottom: '8px' }}>
        <label style={{ fontWeight: 'bold' }}>Provider:</label>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as LlmProvider)}
          style={{ background: 'var(--vscode-dropdown-background)', color: 'var(--vscode-dropdown-foreground)', border: '1px solid var(--vscode-dropdown-border)', padding: '4px 8px' }}
        >
          <option value={LlmProvider.OLLAMA}>🦙 Ollama</option>
          <option value={LlmProvider.GEMINI}>♊ Gemini</option>
          <option value={LlmProvider.COPILOT}>✈️ Copilot</option>
        </select>

        <label style={{ fontWeight: 'bold', marginLeft: '12px' }}>Model:</label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          style={{ background: 'var(--vscode-dropdown-background)', color: 'var(--vscode-dropdown-foreground)', border: '1px solid var(--vscode-dropdown-border)', padding: '4px 8px' }}
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

      {/* Message history */}
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

      {/* Footer controls: File Context Bar & Prompt Input */}
      <footer style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--vscode-panel-border)', paddingTop: '8px' }}>
        {/* Attached file context chips */}
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
                  background: 'var(--vscode-badge-background)',
                  color: 'var(--vscode-badge-foreground)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75em',
                  fontFamily: 'monospace',
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

        {/* Input to attach new file path context */}
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
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              border: '1px solid var(--vscode-input-border)',
              padding: '4px 8px',
              fontSize: '0.85em',
            }}
          />
          <button
            onClick={handleAddFileContext}
            disabled={isReadingFile || !filePathInput.trim()}
            style={{
              background: 'var(--vscode-button-secondaryBackground, #3a3d41)',
              color: 'var(--vscode-button-secondaryForeground, #ffffff)',
              border: 'none',
              padding: '4px 12px',
              cursor: isReadingFile || !filePathInput.trim() ? 'not-allowed' : 'pointer',
              fontSize: '0.85em',
            }}
          >
            {isReadingFile ? 'Reading...' : '+ Add Context'}
          </button>
        </div>

        {/* Instruction Prompt & Send Button */}
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
              background: 'var(--vscode-input-background)',
              color: 'var(--vscode-input-foreground)',
              border: '1px solid var(--vscode-input-border)',
              padding: '6px',
              resize: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            style={{
              background: 'var(--vscode-button-background)',
              color: 'var(--vscode-button-foreground)',
              border: 'none',
              padding: '0 16px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
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

echo "✅ feat: Formatted token counts with space separators (> 999) and KB/MB units (> 9 999)!"
npm run compile

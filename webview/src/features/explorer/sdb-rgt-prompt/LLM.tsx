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

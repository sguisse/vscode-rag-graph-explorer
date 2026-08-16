import { useState, useEffect } from 'react';
import {
  LlmProvider,
  IChatMessageDto,
  ILlmModelInfo,
  IFileContextDto,
} from '@/shared/services/llm-chat';
import { llmChatApiService } from '@/services/api/llm-chat-api.service.gen';
import { useExplorerStore } from '../../store/useExplorerStore';

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
  const provider = useExplorerStore((s) => s.llmProvider);
  const setProvider = useExplorerStore((s) => s.setLlmProvider);
  const selectedModel = useExplorerStore((s) => s.llmSelectedModel);
  const setSelectedModel = useExplorerStore((s) => s.setLlmSelectedModel);
  const messages = useExplorerStore((s) => s.llmMessages);
  const setMessages = useExplorerStore((s) => s.setLmMessages);
  const inputPrompt = useExplorerStore((s) => s.llmInputPrompt);
  const setInputPrompt = useExplorerStore((s) => s.setLlmInputPrompt);
  const temperature = useExplorerStore((s) => s.llmTemperature);
  const setTemperature = useExplorerStore((s) => s.setLlmTemperature);
  const attachedFiles = useExplorerStore((s) => s.llmAttachedFiles);
  const setAttachedFiles = useExplorerStore((s) => s.setLlmAttachedFiles);
  const filePathInput = useExplorerStore((s) => s.llmFilePathInput);
  const setFilePathInput = useExplorerStore((s) => s.setLlmFilePathInput);

  const [models, setModels] = useState<ILlmModelInfo[]>([]);
  const [systemPrompt] = useState<string>('You are an expert Graph RAG Assistant.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
        if (!selectedModel || !available.some((m) => m.id === selectedModel)) {
          setSelectedModel(available[0].id);
        }
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

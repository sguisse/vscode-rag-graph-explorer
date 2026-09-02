import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronsDown, ChevronsUp, ArrowUp, ArrowDown } from 'lucide-react';
import { useLlmChat } from '@/features/sdlc/domains/llm-chat/hooks/use-llm-chat';
import { UserMessageBlock } from './chat-blocks/UserMessageBlock';
import { AssistantMessageBlock } from './chat-blocks/AssistantMessageBlock';

export const LlmChatHistory: React.FC = () => {
  const {
    provider,
    selectedModel,
    messages,
    globalExpanded,
    scrollContainerRef,
    messagesEndRef,
    handleScrollToTop,
    handleScrollToBottom,
    handleExpandAll,
    handleCollapseAll,
  } = useLlmChat();

  const uniqueMessages = useMemo(() => {
    const seen = new Set<string>();
    return messages.filter((msg) => {
      if (seen.has(msg.id || '')) return false;
      seen.add(msg.id || '');
      return true;
    });
  }, [messages]);

  return (
    <div className="relative flex flex-col gap-1 bg-background p-0 w-full h-full min-h-0 overflow-hidden font-sans text-foreground">
      {/* Standard Panel Top Toolbar */}
      <div className="flex justify-between items-center bg-muted/20 px-2 py-1 border-border border-b font-mono text-xs shrink-0">
        <div className="flex items-center gap-1">
          <Button
            className="hover:bg-muted p-1 rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleExpandAll}
            data-tooltip="Expand All Message Panels"
          >
            <ChevronsDown size={13} />
          </Button>
          <Button
            className="hover:bg-muted p-1 rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleCollapseAll}
            data-tooltip="Collapse All Message Panels"
          >
            <ChevronsUp size={13} />
          </Button>
          <span className="font-bold text-[11px] text-muted-foreground ml-1">
            History ({uniqueMessages.length})
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            className="hover:bg-muted p-1 rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleScrollToTop}
            data-tooltip="Scroll to Top"
          >
            <ArrowUp size={13} />
          </Button>
          <Button
            className="hover:bg-muted p-1 rounded w-7 h-7 text-muted-foreground hover:text-foreground transition-colors"
            variant="ghost"
            size="icon"
            onClick={handleScrollToBottom}
            data-tooltip="Scroll to Bottom"
          >
            <ArrowDown size={13} />
          </Button>
        </div>
      </div>

      {/* Message History List */}
      <div
        ref={scrollContainerRef}
        className="flex flex-col flex-1 gap-2.5 p-2 min-h-0 overflow-y-auto"
      >
        {uniqueMessages.length === 0 ? (
          <div className="opacity-60 mt-8 font-mono text-xs text-center italic">
            No conversation started. Select a model and send an instruction to begin.
          </div>
        ) : (
          uniqueMessages.map((msg) =>
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
    </div>
  );
};

export default LlmChatHistory;

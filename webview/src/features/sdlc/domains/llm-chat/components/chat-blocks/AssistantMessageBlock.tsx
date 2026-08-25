import React from 'react';
import { IChatMessageDto, LlmProvider } from '@/shared/services/llm-chat';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { formatTokenCount, formatExecutionTime } from '@/features/sdlc/domains/llm-chat/hooks/use-llm-chat';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '@/features/sdlc/domains/llm-chat/store/useLlmDomainState';

export const AssistantMessageBlock: React.FC<{
  msg: IChatMessageDto;
  fallbackProvider: LlmProvider;
  fallbackModel: string;
  globalExpanded?: { value: boolean; id: number };
}> = ({ msg, fallbackProvider, fallbackModel, globalExpanded }) => {
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const expandedCards = useExplorerStore((s) => s.llmExpandedCards);
  const setLlmExpandedCard = useExplorerStore((s) => s.setLlmExpandedCard);

  const cardId = `asst-${msg.id}`;
  const isOpen = expandedCards[cardId] ?? true;

  // Assistant Response Block Adaptive Colors (Yellow / Amber palette)
  const assistantBg = isDarkMode
    ? 'color-mix(in srgb, var(--yellow-7, #653200) 25%, var(--card))'
    : 'color-mix(in srgb, var(--yellow-0, #fff8c5) 35%, var(--card))';
  const assistantBgHeader = isDarkMode
    ? 'color-mix(in srgb, var(--yellow-6, #834800) 45%, var(--card))'
    : 'color-mix(in srgb, var(--yellow-1, #f7d162) 40%, var(--card))';
  const assistantBorder = isDarkMode
    ? 'color-mix(in srgb, var(--yellow-2, #fabf21) 50%, var(--border))'
    : 'color-mix(in srgb, var(--yellow-3, #db9d00) 45%, var(--border))';

  const showFooter = msg.promptTokens !== undefined || msg.executionTimeMs !== undefined;

  return (
    <CollapsibleCard
      cardId={cardId}
      isOpen={isOpen}
      onToggle={(openState) => setLlmExpandedCard(cardId, openState)}
      title={
        <span className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300 text-xs">
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

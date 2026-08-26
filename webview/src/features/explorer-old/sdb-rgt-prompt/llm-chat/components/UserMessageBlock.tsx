import React from 'react';
import { IChatMessageDto } from '@/shared/services/llm-chat';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { parseUserMessageContent, formatDateTime } from '../../hooks/use-llm-chat';
import { useAppContextStore } from '@/store/useAppContextStore';
import { useExplorerStore } from '../../../store/useExplorerStore';

export const UserMessageBlock: React.FC<{
  msg: IChatMessageDto;
  globalExpanded?: { value: boolean; id: number };
}> = ({ msg, globalExpanded }) => {
  const isDarkMode = useAppContextStore((s) => s.isDarkMode);
  const expandedCards = useExplorerStore((s) => s.llmExpandedCards);
  const setLlmExpandedCard = useExplorerStore((s) => s.setLlmExpandedCard);

  const mainCardId = `user-${msg.id}`;
  const contextCardId = `user-ctx-${msg.id}`;
  const promptCardId = `user-inst-${msg.id}`;

  const isMainOpen = expandedCards[mainCardId] ?? true;
  const isContextOpen = expandedCards[contextCardId] ?? false;
  const isPromptOpen = expandedCards[promptCardId] ?? true;

  const { contextText, instructionText } = parseUserMessageContent(msg.content);

  // User Message Main Block Adaptive Colors
  const userBg = isDarkMode
    ? 'color-mix(in srgb, var(--blue-7, #082a8f) 25%, var(--card))'
    : 'color-mix(in srgb, var(--blue-1, #bcecff) 18%, var(--card))';
  const userBgHeader = isDarkMode
    ? 'color-mix(in srgb, var(--blue-6, #1530b7) 40%, var(--card))'
    : 'color-mix(in srgb, var(--blue-2, #8dd6ff) 35%, var(--card))';
  const userBorder = isDarkMode
    ? 'color-mix(in srgb, var(--blue-4, #0377ff) 45%, var(--border))'
    : 'color-mix(in srgb, var(--blue-3, #5fb9ff) 40%, var(--border))';

  // Shared Sub-Card Colors
  const subCardBg = isDarkMode
    ? 'color-mix(in srgb, var(--black-0, #000000) 30%, var(--card))'
    : 'color-mix(in srgb, var(--white-0, #ffffff) 65%, var(--card))';
  const subCardHeader = isDarkMode
    ? 'color-mix(in srgb, var(--gray-7, #191f1b) 60%, var(--card))'
    : 'color-mix(in srgb, var(--gray-0, #f2f5f3) 85%, var(--card))';
  const subCardBorder = isDarkMode
    ? 'color-mix(in srgb, var(--gray-4, #58635b) 40%, var(--border))'
    : 'color-mix(in srgb, var(--gray-2, #d2d9d4) 60%, var(--border))';

  return (
    <CollapsibleCard
      cardId={mainCardId}
      isOpen={isMainOpen}
      onToggle={(isOpen) => setLlmExpandedCard(mainCardId, isOpen)}
      title={
        <span className="flex items-center gap-1.5 font-bold text-blue-600 dark:text-blue-400 text-xs">
          👤 USER Request
        </span>
      }
      defaultExpanded={true}
      globalExpanded={globalExpanded}
      contentToCopy={msg.content}
      className="self-end w-full max-w-[90%]"
      style={{
        backgroundColor: userBg,
        borderColor: userBorder,
        color: 'var(--foreground)',
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
            cardId={contextCardId}
            isOpen={isContextOpen}
            onToggle={(isOpen) => setLlmExpandedCard(contextCardId, isOpen)}
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
          cardId={promptCardId}
          isOpen={isPromptOpen}
          onToggle={(isOpen) => setLlmExpandedCard(promptCardId, isOpen)}
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

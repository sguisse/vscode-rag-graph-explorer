import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Send,
  RotateCcw,
  GripHorizontal,
  Database,
  Layers,
  FileText,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CollapsibleCard } from '@/components/app/collapsible-card';
import { ReferenceItem } from '@/shared/services/reference/model/reference-model';
import { TopMiddleBottomPanel } from '@/components/app/top-middle-bottom-panel';
import { useLlmPromptPanel } from '../../hooks/use-llm-prompt-panel';
import { ContextFilesSplitView } from './context-files-split-view';

export interface LlmPromptPanelProps {
  allReferences?: ReferenceItem[];
  onSendToLlm?: (prompt: string, selectedRefs: ReferenceItem[]) => void;
}

export function LlmPromptPanel({
  allReferences = [],
  onSendToLlm,
}: LlmPromptPanelProps) {
  const {
    promptText,
    promptCharCount,
    promptEstimatedTokens,
    selectedReferencesFromChat,
    selectedRefIds,
    sortedReferences,
    totalRefSizeKb,
    handlePromptChange,
    handleToggleReference,
    handleSelectAll,
    handleDeselectAll,
    handleResetFromInstructions,
    handleSend,
  } = useLlmPromptPanel({ allReferences, onSendToLlm });

  // Height Split: Prompt Area vs. Files Context Split View
  const [promptHeightPercent, setPromptHeightPercent] = useState<number>(35);
  const [isPromptExpanded, setIsPromptExpanded] = useState<boolean>(true);
  const isDraggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDownHeightResizer = (e: React.MouseEvent) => {
    if (!isPromptExpanded) return;
    e.preventDefault();
    isDraggingRef.current = true;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const offsetY = moveEvent.clientY - rect.top;
      const percentage = Math.max(15, Math.min(75, (offsetY / rect.height) * 100));
      setPromptHeightPercent(percentage);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const topContent = (
    <div className="flex justify-between items-center bg-muted/30 px-3 py-1.5 border-border border-b font-mono text-xs shrink-0">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-amber-400" />
        <span className="font-bold text-foreground text-xs uppercase tracking-wide">
          Prompt & Context Tuning
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleResetFromInstructions}
        className="px-2 h-6 text-[10px] text-muted-foreground hover:text-foreground"
        data-tooltip="Reset prompt and reference selections from Instructions"
      >
        <RotateCcw size={11} className="mr-1" /> Reset
      </Button>
    </div>
  );

  const middleContent = (
    <div ref={containerRef} className="flex flex-col w-full h-full min-h-0 overflow-hidden font-mono text-xs p-1.5">
      {/* Top Region: Structured Prompt in CollapsibleCard */}
      <div
        style={isPromptExpanded ? { height: `${promptHeightPercent}%` } : { height: 'auto' }}
        className="flex flex-col min-h-0 shrink-0 transition-all duration-150"
      >
        <CollapsibleCard
          title={
            <div className="flex items-center gap-1.5">
              <FileText size={13} className="text-amber-400" />
              <span className="font-bold text-xs uppercase">Structured Prompt</span>
            </div>
          }
          badge={`${promptCharCount} Chars (~${promptEstimatedTokens} tokens)`}
          defaultExpanded={true}
          isOpen={isPromptExpanded}
          onToggle={(isOpen) => setIsPromptExpanded(isOpen)}
          contentToCopy={promptText}
          className="flex flex-col bg-card border-border h-full min-h-0 overflow-hidden"
        >
          <div className="flex flex-col p-1.5 space-y-1 h-full min-h-0">
            <Textarea
              value={promptText}
              onChange={(e) => handlePromptChange(e.target.value)}
              placeholder="Adjust your prompt instructions before sending to LLM..."
              className="flex-1 bg-background p-2 border-border focus-visible:ring-primary h-full min-h-[60px] font-mono text-xs resize-none"
            />
          </div>
        </CollapsibleCard>
      </div>

      {/* Horizontal Drag Resizer Handle (Visible only when prompt is expanded) */}
      {isPromptExpanded && (
        <div
          onMouseDown={handleMouseDownHeightResizer}
          className="group flex justify-center items-center bg-muted/50 hover:bg-primary/20 border-border/60 border-y my-1 h-2 transition-colors cursor-row-resize shrink-0"
          data-tooltip="Drag to resize Prompt vs Files Panel height"
        >
          <GripHorizontal size={12} className="text-muted-foreground group-hover:text-primary" />
        </div>
      )}

      {/* Bottom Region: Context Files Horizontal Split View (Codebase Files | Reference Files) */}
      <div
        style={
          isPromptExpanded
            ? { height: `calc(${100 - promptHeightPercent}% - 0.5rem)` }
            : { flex: '1 1 0%', height: '0px' }
        }
        className="flex-1 min-h-0 overflow-hidden mt-1"
      >
        <ContextFilesSplitView
          sortedReferences={sortedReferences}
          selectedRefIds={selectedRefIds}
          selectedReferencesCount={selectedReferencesFromChat.length}
          totalReferencesCount={allReferences.length}
          onToggleReference={handleToggleReference}
          onSelectAllReferences={handleSelectAll}
          onDeselectAllReferences={handleDeselectAll}
        />
      </div>
    </div>
  );

  const bottomContent = (
    <div className="flex flex-col bg-muted/20 border-border border-t p-2 shrink-0 gap-2">
      {/* Footer Context Summary */}
      <div className="flex flex-wrap justify-between items-center gap-2 font-mono text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 border border-border rounded">
            <Layers size={10} className="text-amber-400" /> Prompt: {promptCharCount} chars (~{promptEstimatedTokens} tokens)
          </span>
          <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 border border-border rounded">
            <Database size={10} className="text-primary" /> References: {selectedReferencesFromChat.length} files ({totalRefSizeKb} KB)
          </span>
        </div>
        <span className="font-bold text-foreground">
          Full Context Size: ~{totalRefSizeKb + Math.round(promptCharCount / 1024)} KB
        </span>
      </div>

      {/* Action Footer */}
      {onSendToLlm && (
        <div className="flex justify-end items-center pt-1 border-border/40 border-t">
          <Button size="sm" onClick={handleSend} className="gap-1.5 px-3 h-7 font-bold text-xs">
            <Send size={12} /> Send to LLM
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <TopMiddleBottomPanel
      id="panel-llm-prompt-tuning"
      className="bg-card w-full h-full min-h-0 overflow-hidden"
      top={topContent}
      middle={middleContent}
      bottom={bottomContent}
    />
  );
}

export default LlmPromptPanel;

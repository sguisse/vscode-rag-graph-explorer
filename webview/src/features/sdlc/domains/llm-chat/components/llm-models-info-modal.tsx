import React from 'react';
import { LlmProvider } from '@/shared/services/llm-chat';
import { LLMModelsInfo } from './llm-models-info';
import { useDraggablePopup } from '@/features/sdlc/domains/llm-chat/hooks/use-llm-models-info-modal';
import { X, Sparkles, Move, Maximize2, Minus, Square, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LLMModelsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider?: LlmProvider | 'all';
  onSelectModel?: (provider: LlmProvider, modelId: string) => void;
}

export const LLMModelsInfoModal: React.FC<LLMModelsInfoModalProps> = ({
  isOpen,
  onClose,
  currentProvider = 'all',
  onSelectModel,
}) => {
  const {
    modalRef,
    isMaximized,
    isMinimized,
    toggleMaximize,
    toggleMinimize,
    startDrag,
    startResize,
  } = useDraggablePopup(isOpen);

  if (!isOpen) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: 'fixed',
        left: '16px',
        top: '16px',
        width: '1000px',
        height: '800px',
        backfaceVisibility: 'hidden',
        transform: 'translateZ(0)',
      }}
      className={`z-40 flex flex-col bg-card border border-border shadow-2xl overflow-hidden ${
        isMaximized ? 'rounded-none border-none' : 'rounded-xl'
      }`}
    >
      {/* Draggable Header Bar (Double click to Maximize/Restore) */}
      <div
        onMouseDown={startDrag}
        onDoubleClick={toggleMaximize}
        className="flex justify-between items-center bg-muted/50 px-3 py-2 border-border border-b rounded-t-xl cursor-move select-none shrink-0"
      >
        <div className="flex items-center gap-2">
          {!isMaximized && <Move className="w-3.5 h-3.5 text-muted-foreground" />}
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-xs uppercase tracking-wide">
            LLM Model Capabilities & Specifications
          </h3>
        </div>

        {/* Window Control Buttons */}
        <div className="flex items-center gap-1">
          {/* Minimize Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleMinimize();
            }}
            className="hover:bg-muted rounded-full w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
            data-tooltip={isMinimized ? "Restore Window" : "Minimize Window"}
          >
            <Minus size={13} />
          </Button>

          {/* Maximize / Restore Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              toggleMaximize();
            }}
            className="hover:bg-muted rounded-full w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
            data-tooltip={isMaximized ? "Restore Size" : "Maximize Window"}
          >
            {isMaximized ? <Copy size={12} className="rotate-180" /> : <Square size={11} />}
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:bg-muted rounded-full w-6 h-6 text-muted-foreground hover:text-foreground cursor-pointer"
            data-tooltip="Close Window"
          >
            <X size={13} />
          </Button>
        </div>
      </div>

      {/* Main Content Panel (Hidden when minimized) */}
      {!isMinimized && (
        <div className="flex-1 bg-background p-2.5 rounded-b-xl min-h-0 overflow-hidden select-text">
          <LLMModelsInfo
            initialProvider={currentProvider}
            onSelectModel={(prov, modelId) => {
              if (onSelectModel) {
                onSelectModel(prov, modelId);
              }
              onClose();
            }}
          />
        </div>
      )}

      {/* Resize Bottom-Right Handle (Disabled when maximized or minimized) */}
      {!isMaximized && !isMinimized && (
        <div
          onMouseDown={startResize}
          className="right-0 bottom-0 z-20 absolute flex justify-center items-center w-4 h-4 text-muted-foreground/60 hover:text-primary transition-colors cursor-se-resize"
          data-tooltip="Resize Window"
        >
          <Maximize2 size={10} className="rotate-90" />
        </div>
      )}
    </div>
  );
};

export default LLMModelsInfoModal;

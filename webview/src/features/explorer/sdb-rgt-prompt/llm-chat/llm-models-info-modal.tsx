import React from 'react';
import { LlmProvider } from '@/shared/services/llm-chat';
import { LLMModelsInfo } from './llm-models-info';
import { useDraggablePopup } from '../hooks/use-llm-models-info-modal';
import { X, Sparkles, Move, Maximize2, Minus, Square, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LLMModelsInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProvider?: LlmProvider | 'all';
}

export const LLMModelsInfoModal: React.FC<LLMModelsInfoModalProps> = ({
  isOpen,
  onClose,
  currentProvider = 'all',
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
        className="flex justify-between items-center bg-muted/50 px-3 py-2 border-b border-border shrink-0 cursor-move select-none rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          {!isMaximized && <Move className="w-3.5 h-3.5 text-muted-foreground" />}
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-wide text-foreground">
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
            className="w-6 h-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
            title={isMinimized ? "Restore Window" : "Minimize Window"}
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
            className="w-6 h-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
            title={isMaximized ? "Restore Size" : "Maximize Window"}
          >
            {isMaximized ? <Copy size={12} className="rotate-180" /> : <Square size={11} />}
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-6 h-6 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full cursor-pointer"
            title="Close Window"
          >
            <X size={13} />
          </Button>
        </div>
      </div>

      {/* Main Content Panel (Hidden when minimized) */}
      {!isMinimized && (
        <div className="flex-1 p-2.5 min-h-0 overflow-hidden bg-background rounded-b-xl select-text">
          <LLMModelsInfo initialProvider={currentProvider} />
        </div>
      )}

      {/* Resize Bottom-Right Handle (Disabled when maximized or minimized) */}
      {!isMaximized && !isMinimized && (
        <div
          onMouseDown={startResize}
          className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize flex items-center justify-center text-muted-foreground/60 hover:text-primary transition-colors z-20"
          title="Resize Window"
        >
          <Maximize2 size={10} className="rotate-90" />
        </div>
      )}
    </div>
  );
};

export default LLMModelsInfoModal;

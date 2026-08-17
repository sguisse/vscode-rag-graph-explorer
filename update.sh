#!/usr/bin/env bash
set -e

# Ensure target directories exist
mkdir -p webview/src
mkdir -p webview/src/components/app
mkdir -p webview/src/features/explorer/sdb-rgt-prompt/llm-chat

# 1. Neutralize native CSS tooltips to prevent pseudo-element pointer interference
cat << 'EOF' > webview/src/styles-data-tooltip.css
/* Neutralize native CSS tooltips to prevent event interference */
[data-tooltip]::before,
[data-tooltip]::after {
  display: none !important;
  content: none !important;
}
EOF

# 2. Refactor Tooltip component: Direct DOM positioning without continuous React state updates
cat << 'EOF' > webview/src/components/app/tooltip.tsx
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface TooltipProps {
  delay?: number;
}

export function Tooltip({ delay = 200 }: TooltipProps) {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTargetRef = useRef<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDomPosition = (clientX: number, clientY: number) => {
      const el = tooltipRef.current;
      if (!el) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const tooltipWidth = el.offsetWidth || 220;
      const tooltipHeight = el.offsetHeight || 40;
      const offset = 12;

      let left = clientX + offset;
      if (left + tooltipWidth > viewportWidth - 8) {
        left = clientX - tooltipWidth - offset;
      }
      left = Math.max(8, left);

      let top = clientY - tooltipHeight / 2;
      top = Math.max(8, Math.min(top, viewportHeight - tooltipHeight - 8));

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const target = (e.target as Element)?.closest?.('[data-tooltip]');

      if (target) {
        const text = target.getAttribute('data-tooltip') || '';

        if (!text) {
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);
          activeTargetRef.current = null;
          return;
        }

        if (activeTargetRef.current !== target) {
          activeTargetRef.current = target;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);

          timeoutRef.current = setTimeout(() => {
            if (activeTargetRef.current === target) {
              setContent(text);
              setVisible(true);
              updateDomPosition(e.clientX, e.clientY);
            }
          }, delay);
        } else {
          updateDomPosition(e.clientX, e.clientY);
        }
      } else {
        if (activeTargetRef.current) {
          activeTargetRef.current = null;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);
        }
      }
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delay]);

  if (!content) return null;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[999999] pointer-events-none select-none transition-opacity duration-100",
        "px-3 py-2 rounded-md shadow-2xl border max-w-md font-sans text-xs leading-relaxed break-words",
        "bg-slate-900 text-slate-50 border-slate-700",
        "dark:bg-slate-900 dark:text-slate-100 dark:border-slate-700",
        visible ? "opacity-100" : "opacity-0"
      )}
      style={{ left: '-9999px', top: '-9999px' }}
    >
      <span
        className="block relative z-10 whitespace-pre-wrap leading-normal"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
EOF

# 3. Update LLMModelsInfoModal container with stable layout & z-index stacking
cat << 'EOF' > webview/src/features/explorer/sdb-rgt-prompt/llm-chat/llm-models-info-modal.tsx
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
    geometry,
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
      style={{
        position: 'fixed',
        left: `${geometry.x}px`,
        top: `${geometry.y}px`,
        width: `${geometry.width}px`,
        height: `${geometry.height}px`,
      }}
      className={`z-40 flex flex-col bg-card border border-border shadow-2xl ${
        isMaximized ? 'rounded-none border-none' : 'rounded-xl'
      }`}
    >
      {/* Draggable Header Bar */}
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

        {/* Window Controls */}
        <div className="flex items-center gap-1">
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

      {/* Main Content Panel */}
      {!isMinimized && (
        <div className="flex-1 p-2.5 min-h-0 overflow-hidden bg-background rounded-b-xl">
          <LLMModelsInfo initialProvider={currentProvider} />
        </div>
      )}

      {/* Resize Bottom-Right Handle */}
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
EOF

# 4. Build project to verify

import React, { useState, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { WorkflowPanel } from './workflow-panel';

interface WorkflowPopupProps {
  children: React.ReactNode;
  onSelectStep?: (stepId: string) => void;
  side?: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
}

export function WorkflowPopup({
  children,
  onSelectStep,
  side = 'bottom',
  align = 'center',
}: WorkflowPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger>
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="inline-block"
        >
          {children}
        </div>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        className="z-[9999] bg-card/95 shadow-2xl backdrop-blur-md p-0 border-primary/20 rounded-xl w-[1000px] overflow-hidden font-mono text-xs animate-in duration-200 fade-in zoom-in-95"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <WorkflowPanel
          onSelectStep={(stepId) => {
            if (onSelectStep) onSelectStep(stepId);
            setIsOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

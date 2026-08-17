"use client"

import React, { useState, useEffect, useRef } from 'react';
import { cn } from "@/lib/utils";

interface TooltipProps {
  delay?: number;
}

export function Tooltip({ delay = 300 }: TooltipProps) {
  const [content, setContent] = useState('');
  const [visible, setVisible] = useState(false);

  const [coords, setCoords] = useState<{
    tooltipLeft: number;
    tooltipTop: number;
    arrowTop: number;
    side: 'left' | 'right';
  }>({
    tooltipLeft: 0,
    tooltipTop: 0,
    arrowTop: 0,
    side: 'right',
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeTargetRef = useRef<Element | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const latestMouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (clientX: number, clientY: number) => {
      if (!tooltipRef.current) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const tooltipWidth = tooltipRef.current.offsetWidth || 200;
      const tooltipHeight = tooltipRef.current.offsetHeight || 40;
      const arrowSizeOffset = 12;

      let side: 'left' | 'right' = 'right';
      let tooltipLeft = clientX + arrowSizeOffset;

      if (tooltipLeft + tooltipWidth > viewportWidth) {
        side = 'left';
        tooltipLeft = clientX - tooltipWidth - arrowSizeOffset;
      }
      if (tooltipLeft < 4) tooltipLeft = 4;

      let tooltipTop = clientY - tooltipHeight / 2;
      tooltipTop = Math.max(6, Math.min(tooltipTop, viewportHeight - tooltipHeight - 6));

      const arrowRelativeY = clientY - tooltipTop;
      const safetyPadding = 8;
      const arrowTop = Math.max(safetyPadding, Math.min(arrowRelativeY, tooltipHeight - safetyPadding));

      setCoords({ tooltipLeft, tooltipTop, arrowTop, side });
    };

    const handleMouseMove = (e: MouseEvent) => {
      latestMouseRef.current = { x: e.clientX, y: e.clientY };
      const target = (e.target as Element).closest('[data-tooltip]');

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
              updatePosition(latestMouseRef.current.x, latestMouseRef.current.y);
            }
          }, delay);
        } else if (visible) {
          if (text !== content) setContent(text);
          updatePosition(e.clientX, e.clientY);
        }
      } else {
        if (activeTargetRef.current) {
          activeTargetRef.current = null;
          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          setVisible(false);
        }
      }
    };

    document.body.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.body.removeEventListener('mousemove', handleMouseMove);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [delay, visible, content]);

  if (!content) return null;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "inline-flex z-[999999] fixed items-center shadow-md px-3 py-1.5 rounded-md max-w-xs font-sans font-medium text-xs break-words leading-normal transition-opacity duration-150 pointer-events-none select-none",

        // Light Mode (Dark Background /Light Text) -Shadcn Style
        "bg-slate-900 text-slate-50 border border-slate-800",

        // Dark Mode (Light Background /Dark Text) -Shadcn Style
        "dark:bg-slate-50 dark:text-slate-900 dark:border-slate-200",

        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{
        left: `${coords.tooltipLeft}px`,
        top: `${coords.tooltipTop}px`,
      }}
    >
      <span className="block z-10 relative"
            dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* Tooltip Arrow */}
      <div
        className={cn(
          "z-0 absolute border border-transparent size-2",

          // Inverted arrow background
          "bg-slate-900 dark:bg-slate-50",

          // Arrow borders according to position and theme
          coords.side === 'right'
            ? "-left-1 border-l-slate-800 border-b-slate-800 dark:border-l-slate-200 dark:border-b-slate-200"
            : "-right-1 border-r-slate-800 border-t-slate-800 dark:border-r-slate-200 dark:border-t-slate-200"
        )}
        style={{
          top: `${coords.arrowTop}px`,
          transform: 'translateY(-50%) rotate(45deg)',
        }}
      />
    </div>
  );
}

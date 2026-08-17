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

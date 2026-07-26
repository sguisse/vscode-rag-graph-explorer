"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface UseResizableProps {
  initialSize: number;
  minSize: number;
  maxSize: number;
  isHorizontal?: boolean;
  reverse?: boolean;
  collapseThreshold?: number;
}

/**
 * Advanced layout management hook for high-performance split views.
 * Prevents text selection ghosting, locks global mouse cursors, and supports adaptive snap-to-collapse boundaries.
 */
export function useResizable(
  initialSize: number,
  minSize: number,
  maxSize: number,
  isHorizontal: boolean = true,
  reverse: boolean = false,
  collapseThreshold?: number
) {
  const [size, setSize] = useState<number>(initialSize);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const sizeRef = useRef<number>(size);

  // Sync internal ref tracking with state to avoid closure traps during heavy reflows
  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsDragging(true);

    const startSize = sizeRef.current;
    const startPosition = isHorizontal ? mouseDownEvent.clientX : mouseDownEvent.clientY;

    // Prevent document selections and lock cursor visuals across the body node frame
    const targetCursor = isHorizontal ? 'col-resize' : 'row-resize';
    document.body.style.cursor = targetCursor;
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const currentPosition = isHorizontal ? mouseMoveEvent.clientX : mouseMoveEvent.clientY;
      const delta = currentPosition - startPosition;
      const newRawSize = reverse ? startSize - delta : startSize + delta;

      let finalSize = Math.min(Math.max(newRawSize, minSize), maxSize);

      // Snap-to-Collapse Calculations
      if (collapseThreshold !== undefined && finalSize < collapseThreshold) {
        finalSize = 0;
      } else if (collapseThreshold !== undefined && finalSize >= collapseThreshold && sizeRef.current === 0) {
        finalSize = minSize; // Re-open cleanly when dragged outward past limit
      }

      setSize(finalSize);
    };

    const onMouseUp = () => {
      setIsDragging(false);

      // Clear global overrides instantly
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.body.style.webkitUserSelect = '';

      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, [isHorizontal, reverse, minSize, maxSize, collapseThreshold]);

  return [size, startResizing, isDragging, setSize] as const;
}

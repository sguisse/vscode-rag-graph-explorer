import { useState, useCallback } from 'react';

interface Point { x: number; y: number; }

export const useMarqueeSelect = () => {
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoint, setCurrentPoint] = useState<Point | null>(null);

  const startSelection = useCallback((x: number, y: number) => {
    setIsSelecting(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  }, []);

  const updateSelection = useCallback((x: number, y: number) => {
    if (isSelecting) {
      setCurrentPoint({ x, y });
    }
  }, [isSelecting]);

  const endSelection = useCallback(() => {
    setIsSelecting(false);
    setStartPoint(null);
    setCurrentPoint(null);
  }, []);

  const getSelectionBox = useCallback(() => {
    if (!startPoint || !currentPoint) return null;
    return {
      left: Math.min(startPoint.x, currentPoint.x),
      top: Math.min(startPoint.y, currentPoint.y),
      width: Math.abs(currentPoint.x - startPoint.x),
      height: Math.abs(currentPoint.y - startPoint.y)
    };
  }, [startPoint, currentPoint]);

  return { isSelecting, startSelection, updateSelection, endSelection, getSelectionBox };
};

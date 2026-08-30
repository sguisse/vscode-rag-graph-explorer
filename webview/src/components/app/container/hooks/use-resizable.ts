import { useState, useCallback, useEffect } from 'react';

export function useResizable(
  initialSize: number,
  minSize: number = 40,
  maxSize: number = 1000,
  isHorizontal: boolean = true,
  reverse: boolean = false
): [number, (e: React.MouseEvent) => void, React.Dispatch<React.SetStateAction<number>>] {
  const [size, setSize] = useState<number>(initialSize);

  // Sync size whenever initialSize prop changes (e.g. via layout configuration overrides)
  useEffect(() => {
    if (initialSize !== undefined && initialSize !== size) {
      setSize(initialSize);
    }
  }, [initialSize]);

  const startResize = useCallback(
    (mouseDownEvent: React.MouseEvent) => {
      mouseDownEvent.preventDefault();
      const startPosition = isHorizontal ? mouseDownEvent.clientX : mouseDownEvent.clientY;
      const startSize = size;

      const onMouseMove = (mouseMoveEvent: MouseEvent) => {
        const currentPosition = isHorizontal ? mouseMoveEvent.clientX : mouseMoveEvent.clientY;
        const delta = reverse ? startPosition - currentPosition : currentPosition - startPosition;
        const newSize = Math.max(minSize, Math.min(maxSize, startSize + delta));
        setSize(newSize);
      };

      const onMouseUp = () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [size, isHorizontal, reverse, minSize, maxSize]
  );

  return [size, startResize, setSize];
}

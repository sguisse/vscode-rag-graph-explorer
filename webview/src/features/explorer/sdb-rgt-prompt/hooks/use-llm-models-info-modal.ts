import { useState, useEffect, useRef } from 'react';

export interface PopupGeometry {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function useLlmModelsInfoModal() {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}

export function useDraggablePopup(isOpen: boolean) {
  const [geometry, setGeometry] = useState<PopupGeometry>({
    x: 16,
    y: 16,
    width: 1000,
    height: 800,
  });

  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const savedGeometry = useRef<PopupGeometry>({ x: 16, y: 16, width: 1000, height: 800 });
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0, initialWidth: 0, initialHeight: 0 });

  // Initial centering / positioning on open
  useEffect(() => {
    if (isOpen && !isMaximized && !isMinimized) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const targetWidth = Math.min(1000, windowWidth - 32);
      const targetHeight = Math.min(800, windowHeight - 32);

      const initialGeom = {
        x: 16,
        y: 16,
        width: targetWidth,
        height: targetHeight,
      };

      setGeometry(initialGeom);
      savedGeometry.current = initialGeom;
    }
  }, [isOpen]);

  // Track window resizing when maximized
  useEffect(() => {
    const handleWindowResize = () => {
      if (isMaximized) {
        setGeometry({
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [isMaximized]);

  const toggleMaximize = () => {
    if (isMinimized) {
      setIsMinimized(false);
    }

    if (isMaximized) {
      // Restore from maximized
      setIsMaximized(false);
      setGeometry(savedGeometry.current);
    } else {
      // Maximize window to full viewport
      savedGeometry.current = geometry;
      setIsMaximized(true);
      setGeometry({
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      // Restore from minimized
      setIsMinimized(false);
      setGeometry(savedGeometry.current);
    } else {
      // Minimize to docked bottom-left pill
      if (!isMaximized) {
        savedGeometry.current = geometry;
      }
      setIsMaximized(false);
      setIsMinimized(true);
      setGeometry({
        x: 16,
        y: Math.max(0, window.innerHeight - 48),
        width: 360,
        height: 38,
      });
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    if (isMaximized) return; // Prevent dragging when maximized
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: geometry.x,
      initialY: geometry.y,
      initialWidth: geometry.width,
      initialHeight: geometry.height,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (isDragging.current) {
        const deltaX = ev.clientX - dragStart.current.x;
        const deltaY = ev.clientY - dragStart.current.y;
        setGeometry((prev) => {
          const next = {
            ...prev,
            x: Math.max(0, dragStart.current.initialX + deltaX),
            y: Math.max(0, dragStart.current.initialY + deltaY),
          };
          if (!isMinimized) savedGeometry.current = next;
          return next;
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startResize = (e: React.MouseEvent) => {
    if (isMaximized || isMinimized) return; // Disable resizer when maximized/minimized
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: geometry.x,
      initialY: geometry.y,
      initialWidth: geometry.width,
      initialHeight: geometry.height,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (isResizing.current) {
        const deltaX = ev.clientX - dragStart.current.x;
        const deltaY = ev.clientY - dragStart.current.y;
        setGeometry((prev) => {
          const next = {
            ...prev,
            width: Math.max(400, dragStart.current.initialWidth + deltaX),
            height: Math.max(300, dragStart.current.initialHeight + deltaY),
          };
          savedGeometry.current = next;
          return next;
        });
      }
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return {
    geometry,
    isMaximized,
    isMinimized,
    toggleMaximize,
    toggleMinimize,
    startDrag,
    startResize,
  };
}

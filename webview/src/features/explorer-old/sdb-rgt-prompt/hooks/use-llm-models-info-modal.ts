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
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const geometryRef = useRef<PopupGeometry>({
    x: 16,
    y: 16,
    width: 1000,
    height: 800,
  });

  const savedGeometryRef = useRef<PopupGeometry>({
    x: 16,
    y: 16,
    width: 1000,
    height: 800,
  });

  // Apply geometry directly to DOM element without triggering React component tree re-renders
  const applyGeometryToDom = (geom: PopupGeometry) => {
    const el = modalRef.current;
    if (!el) return;
    el.style.left = `${geom.x}px`;
    el.style.top = `${geom.y}px`;
    el.style.width = `${geom.width}px`;
    el.style.height = `${geom.height}px`;
  };

  // Open window at Top Left (16px) with default dimensions (1000x800)
  useEffect(() => {
    if (isOpen) {
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

      geometryRef.current = initialGeom;
      savedGeometryRef.current = initialGeom;
      setIsMaximized(false);
      setIsMinimized(false);

      requestAnimationFrame(() => {
        applyGeometryToDom(initialGeom);
      });
    }
  }, [isOpen]);

  // Keep maximized window bound to window dimensions
  useEffect(() => {
    const handleWindowResize = () => {
      if (isMaximized && modalRef.current) {
        applyGeometryToDom({
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
      geometryRef.current = { ...savedGeometryRef.current };
      applyGeometryToDom(savedGeometryRef.current);
    } else {
      // Maximize window to 100% viewport
      savedGeometryRef.current = { ...geometryRef.current };
      setIsMaximized(true);
      const maxGeom = {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
      applyGeometryToDom(maxGeom);
    }
  };

  const toggleMinimize = () => {
    if (isMinimized) {
      // Restore from minimized
      setIsMinimized(false);
      applyGeometryToDom(savedGeometryRef.current);
    } else {
      // Minimize to docked bottom-left header pill
      if (!isMaximized) {
        savedGeometryRef.current = { ...geometryRef.current };
      }
      setIsMaximized(false);
      setIsMinimized(true);
      const minGeom = {
        x: 16,
        y: Math.max(0, window.innerHeight - 42),
        width: 380,
        height: 38,
      };
      applyGeometryToDom(minGeom);
    }
  };

  const startDrag = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = geometryRef.current.x;
    const initialY = geometryRef.current.y;

    if (modalRef.current) {
      modalRef.current.style.willChange = 'left, top';
    }

    let animationFrameId: number | null = null;

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;
      const newX = Math.max(0, initialX + deltaX);
      const newY = Math.max(0, initialY + deltaY);

      geometryRef.current.x = newX;
      geometryRef.current.y = newY;
      if (!isMinimized) {
        savedGeometryRef.current.x = newX;
        savedGeometryRef.current.y = newY;
      }

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (modalRef.current) {
          modalRef.current.style.left = `${newX}px`;
          modalRef.current.style.top = `${newY}px`;
        }
      });
    };

    const handleMouseUp = () => {
      if (modalRef.current) {
        modalRef.current.style.willChange = 'auto';
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startResize = (e: React.MouseEvent) => {
    if (isMaximized || isMinimized) return;
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialWidth = geometryRef.current.width;
    const initialHeight = geometryRef.current.height;

    if (modalRef.current) {
      modalRef.current.style.willChange = 'width, height';
    }

    let animationFrameId: number | null = null;

    const handleMouseMove = (ev: MouseEvent) => {
      const deltaX = ev.clientX - startX;
      const deltaY = ev.clientY - startY;
      const newWidth = Math.max(400, initialWidth + deltaX);
      const newHeight = Math.max(300, initialHeight + deltaY);

      geometryRef.current.width = newWidth;
      geometryRef.current.height = newHeight;
      savedGeometryRef.current.width = newWidth;
      savedGeometryRef.current.height = newHeight;

      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (modalRef.current) {
          modalRef.current.style.width = `${newWidth}px`;
          modalRef.current.style.height = `${newHeight}px`;
        }
      });
    };

    const handleMouseUp = () => {
      if (modalRef.current) {
        modalRef.current.style.willChange = 'auto';
      }
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return {
    modalRef,
    isMaximized,
    isMinimized,
    toggleMaximize,
    toggleMinimize,
    startDrag,
    startResize,
  };
}

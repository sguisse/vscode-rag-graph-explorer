import { useState, useRef, useCallback } from 'react';

export function useWorkflowPopup(
  onSelectStep?: (stepId: string) => void,
  closeDelayMs = 200
) {
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, closeDelayMs);
  }, [closeDelayMs]);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setIsOpen(false);
  }, []);

  const handleSelectStep = useCallback(
    (stepId: string) => {
      if (onSelectStep) {
        onSelectStep(stepId);
      }
      handleClose();
    },
    [onSelectStep, handleClose]
  );

  return {
    isOpen,
    setIsOpen,
    handleMouseEnter,
    handleMouseLeave,
    handleClose,
    handleSelectStep,
  };
}

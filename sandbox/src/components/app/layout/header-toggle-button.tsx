import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface HeaderToggleEyeButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  tooltipText: string;
}

export function HeaderToggleEyeButton({ isVisible, onToggle, tooltipText }: HeaderToggleEyeButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${
        isVisible ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'
      }`}
      data-tooltip={tooltipText}
    >
      <Eye size={16} />
    </Button>
  );
}

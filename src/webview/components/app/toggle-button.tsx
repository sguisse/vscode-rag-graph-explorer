import React from 'react';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ToggleButtonProps {
  id: string;
  isSelected: boolean;
  onToggle: () => void;
  tooltipText: string;
  icon?: string | React.ComponentType<{ size?: number }> | React.ReactNode;
}

function createButton(id: string, isSelected: boolean, onToggle: () => void, tooltipText: string, icon: React.ReactNode) {
  return (
    <Button
      id={id}
      variant="ghost"
      size="icon"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`p-1 rounded transition-all w-8 h-8 cursor-pointer ${
        isSelected
          ? 'text-primary bg-primary/20 border border-primary/40 font-bold shadow-xs hover:bg-primary/30'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
      data-tooltip={tooltipText}
    >
      {icon}
    </Button>
  );
}

export function ToggleButton({ id, isSelected, onToggle, tooltipText, icon }: ToggleButtonProps) {
  if (typeof icon === 'string') {
    return createButton(id, isSelected, onToggle, tooltipText, icon);
  }

  if (React.isValidElement(icon)) {
    return createButton(id, isSelected, onToggle, tooltipText, icon);
  }

  const IconComponent = icon || Eye;

  if (typeof IconComponent === 'function') {
    return createButton(id, isSelected, onToggle, tooltipText, <IconComponent size={16} />);
  }

  return createButton(id, isSelected, onToggle, tooltipText, <Eye size={16} />);
}

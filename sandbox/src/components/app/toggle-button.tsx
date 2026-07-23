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

// Private helper function to create the common button structure
function createButton(id: string, isSelected: boolean, onToggle: () => void, tooltipText: string, icon: React.ReactNode) {
  return (
    <Button
      id={id}
      variant="ghost"
      size="icon"
      onClick={onToggle}
      className={`p-1.5 rounded transition-colors ml-1 w-8 h-8 ${
        isSelected ? 'text-primary bg-primary/10 hover:bg-primary/20' : 'text-muted-foreground hover:bg-muted'
      }`}
      data-tooltip={tooltipText}
    >
      {icon}
    </Button>
  );
}

export function ToggleButton({ id, isSelected, onToggle, tooltipText, icon }: ToggleButtonProps) {
  // If icon is a string, render it as a simple text inside the button
  if (typeof icon === 'string') {
    return createButton(id, isSelected, onToggle, tooltipText, icon);
  }

  // If icon is a React element (JSX), render it directly
  if (React.isValidElement(icon)) {
    return createButton(id, isSelected, onToggle, tooltipText, icon);
  }

  // If icon is a React component, render it with default size
  const IconComponent = icon || Eye;

  // Check if IconComponent is actually a valid component type
  if (typeof IconComponent === 'function') {
    return createButton(id, isSelected, onToggle, tooltipText, <IconComponent size={16} />);
  }

  // Fallback to default Eye icon
  return createButton(id, isSelected, onToggle, tooltipText, <span> <Eye size={16} /> </span>);
}

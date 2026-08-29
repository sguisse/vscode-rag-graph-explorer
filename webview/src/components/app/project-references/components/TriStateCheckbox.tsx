import React from 'react';
import { Check, Minus } from 'lucide-react';

export function TriStateCheckbox({
  state,
  onChange,
  className,
}: {
  state: boolean | 'indeterminate';
  onChange: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className={`flex items-center justify-center w-3.5 h-3.5 rounded border transition-colors cursor-pointer select-none ${
        state === true
          ? 'bg-primary border-primary text-primary-foreground'
          : state === 'indeterminate'
          ? 'bg-primary/20 border-primary text-primary'
          : 'bg-background border-input hover:border-primary/50'
      } ${className || ''}`}
    >
      {state === true && <Check size={10} className="stroke-[3]" />}
      {state === 'indeterminate' && <Minus size={10} className="stroke-[3]" />}
    </button>
  );
}

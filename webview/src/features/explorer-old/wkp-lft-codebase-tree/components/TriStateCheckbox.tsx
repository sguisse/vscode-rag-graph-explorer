import React, { useRef, useEffect } from 'react';
import { TriStateCheckboxProps } from '../model-ui';

export function TriStateCheckbox({ checked, indeterminate, onChange, className }: TriStateCheckboxProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={`rounded w-3.5 h-3.5 border-border bg-background text-primary cursor-pointer shrink-0 accent-primary ${className || ''}`}
    />
  );
}

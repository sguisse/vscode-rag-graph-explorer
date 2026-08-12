import React from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface SelectOption {
  icon?: string | React.ReactNode;
  label: string | React.ReactNode;
  value: string;
}

export const SelectFromTypeBuilder = ({
  id,
  icon,
  label,
  desc,
  value,
  onChange,
  options,
  className = '',
  triggerClassName = ''
}: {
  id?: string;
  icon?: string | React.ReactNode;
  label?: string;
  desc?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  className?: string;
  triggerClassName?: string;
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div id={id} className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className="flex items-center gap-1.5 font-medium text-neutral-900 dark:text-neutral-100 text-xs">
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </span>
      )}
      {desc && <span className="mb-1 text-[11px] text-neutral-500 dark:text-neutral-400">{desc}</span>}
      <Select value={value} onValueChange={(val) => {
            if (val !== null) {
            onChange(val);
            }
        }}>
        <SelectTrigger id={id ? `${id}-trigger` : undefined} size="sm" className={`bg-background border-border shadow-none !h-6 min-h-0 py-0 px-2 rounded-sm text-xs font-mono flex items-center gap-1 ${triggerClassName}`}>
          <SelectValue>
            {selectedOption ? (
              <span className="flex items-center gap-1.5 truncate">
                {selectedOption.icon && <span>{selectedOption.icon}</span>}
                <span>{selectedOption.label}</span>
              </span>
            ) : undefined}
          </SelectValue>
        </SelectTrigger>
        <SelectContent side="bottom">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.icon && <>{opt.icon}&nbsp;</>}{opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

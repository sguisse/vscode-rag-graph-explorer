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
  options
}: {
  id?: string;
  icon?: string | React.ReactNode;
  label?: string;
  desc?: string;
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
}) => {
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div id={id} className="flex flex-col gap-1 py-1">
      {label && (
        <span className="text-xs font-medium text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </span>
      )}
      {desc && <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">{desc}</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id ? `${id}-trigger` : undefined} className="bg-white dark:bg-neutral-800 text-xs h-8">
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

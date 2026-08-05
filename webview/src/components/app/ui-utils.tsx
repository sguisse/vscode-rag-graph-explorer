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
        <SelectTrigger id={id ? `${id}-trigger` : undefined} className="bg-white dark:bg-neutral-800 h-8 text-xs">
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

"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends Omit<React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>, 'checked'> {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean | 'indeterminate') => void;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const isIndeterminate = checked === "indeterminate";
    const isChecked = checked === true;

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        checked={isIndeterminate ? false : isChecked}
        indeterminate={isIndeterminate}
        onCheckedChange={(val) => onCheckedChange?.(val)}
        className={cn(
          "peer group/checkbox relative flex size-4 shrink-0 items-center justify-center rounded-xs border border-primary shadow-2xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground data-checked:bg-primary data-checked:text-primary-foreground data-indeterminate:bg-primary data-indeterminate:text-primary-foreground cursor-pointer",
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator
          data-slot="checkbox-indicator"
          className="flex items-center justify-center text-current"
        >
          {isIndeterminate ? (
            <MinusIcon className="size-3 stroke-[3]" />
          ) : isChecked ? (
            <CheckIcon className="size-3 stroke-[3]" />
          ) : null}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

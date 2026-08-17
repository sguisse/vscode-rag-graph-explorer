import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked = false, onCheckedChange, disabled, ...props }, ref) => {
    return (
      <label className={cn("inline-flex items-center justify-center cursor-pointer", disabled && "cursor-not-allowed opacity-60")}>
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange && onCheckedChange(e.target.checked)}
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            "flex items-center justify-center w-4 h-4 rounded border border-primary transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            checked ? "bg-primary text-primary-foreground" : "bg-background border-input",
            className
          )}
        >
          {checked && <Check className="w-3 h-3 stroke-[3]" />}
        </span>
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }

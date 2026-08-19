import * as React from 'react';
import { Popover as BasePopover } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

export function Popover({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <BasePopover.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </BasePopover.Root>
  );
}

export const PopoverTrigger = BasePopover.Trigger;

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'bottom' | 'left' | 'right';
  sideOffset?: number;
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className, align = 'center', side = 'top', sideOffset = 4, children, ...props }, ref) => (
    <BasePopover.Portal>
      <BasePopover.Positioner side={side} align={align} sideOffset={sideOffset} className="z-[9999]">
        <BasePopover.Popup
          ref={ref}
          className={cn(
            'z-[9999] rounded-lg border bg-popover text-popover-foreground shadow-xl outline-none',
            className
          )}
          {...props}
        >
          {children}
        </BasePopover.Popup>
      </BasePopover.Positioner>
    </BasePopover.Portal>
  )
);
PopoverContent.displayName = 'PopoverContent';

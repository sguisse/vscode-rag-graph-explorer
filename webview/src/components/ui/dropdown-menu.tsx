import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

interface DropdownContextType {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DropdownContext = createContext<DropdownContextType | undefined>(undefined);

export const DropdownMenu: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger: React.FC<{ asChild?: boolean; children: React.ReactNode }> = ({
  children,
}) => {
  const context = useContext(DropdownContext);
  return (
    <div onClick={() => context?.setOpen((prev) => !prev)} className="cursor-pointer inline-block">
      {children}
    </div>
  );
};

export const DropdownMenuContent: React.FC<{
  align?: 'start' | 'end';
  className?: string;
  children: React.ReactNode;
}> = ({ align = 'end', className = '', children }) => {
  const context = useContext(DropdownContext);
  if (!context?.open) return null;

  const alignClass = align === 'end' ? 'right-0' : 'left-0';

  return (
    <div
      className={`absolute ${alignClass} z-50 mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md transition-all ${className}`}
    >
      {children}
    </div>
  );
};

export interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DropdownMenuItem: React.FC<DropdownMenuItemProps> = ({
  className = '',
  children,
  onClick,
  ...props
}) => {
  const context = useContext(DropdownContext);

  return (
    <div
      onClick={(e) => {
        onClick?.(e);
        context?.setOpen(false);
      }}
      className={`relative flex cursor-pointer select-none items-center rounded-xs px-2 py-1.5 text-xs outline-none hover:bg-accent hover:text-accent-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

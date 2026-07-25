import React from 'react';
import { Maximize2, Minimize2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeftCenterRightPanel } from '../left-center-right-panel';
import { useLayoutStore } from '@/store/useLayoutStore';

export interface ContainerPanelHeaderProps {
  id?: string;
  title?: React.ReactNode;
  path?: string;
  isMaximized?: boolean;
  isMaximizable?: boolean;
  isHiddable?: boolean;
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

export function ContainerPanelHeader({
  id,
  title,
  path,
  isMaximized,
  isMaximizable = true,
  isHiddable = true,
  headerLeft,
  headerCenter,
  headerRight,
  className,
}: ContainerPanelHeaderProps) {
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setContainerVisible = useLayoutStore((s) => s.setContainerVisible);

  const computedLeft = headerLeft || (
    typeof title === 'string' ? (
      <span className="font-semibold truncate uppercase tracking-wider">{title}</span>
    ) : (
      title
    )
  );

  const computedRight = (
    <div className="flex items-center gap-1 text-amber-100">
      {headerRight}
      {isMaximizable && path && (
        <Button
          id={`btn-maximize-${path.replace(/\./g, '-')}`}
          variant="ghost"
          size="icon-xs"
          onClick={() => toggleContainerMaximized(path)}
          className="w-5 h-5 text-muted-foreground hover:text-foreground shrink-0"
          data-tooltip={isMaximized ? "Restore Panel Size" : "Maximize Panel"}
        >
          {isMaximized ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </Button>
      )}
      {isHiddable && path && (
        <Button
          id={`btn-hide-${path.replace(/\./g, '-')}`}
          variant="ghost"
          size="icon-xs"
          onClick={() => setContainerVisible(path, false)}
          className="w-5 h-5 text-muted-foreground hover:text-foreground shrink-0"
          data-tooltip="Hide Panel"
        >
          <EyeOff size={12} />
        </Button>
      )}
    </div>
  );

  return (
    <LeftCenterRightPanel
      id={id || (path ? `header-${path.replace(/\./g, '-')}` : 'container-panel-header')}
      className={`px-3 h-7 bg-muted/30 border-b border-border text-[10px] font-mono text-muted-foreground select-none shrink-0 ${className || ''}`}
      left={computedLeft}
      center={headerCenter}
      right={computedRight}
    />
  );
}

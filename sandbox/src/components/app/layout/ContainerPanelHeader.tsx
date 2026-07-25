import React from 'react';
import { Maximize2, Minimize2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LeftCenterRightPanel } from '../left-center-right-panel';
import { useLayoutStore } from '@/store/useLayoutStore';
import { LayoutContainer } from './types';

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
  isMaximized: isMaximizedProp,
  isMaximizable: isMaximizableProp,
  isHiddable: isHiddableProp,
  headerLeft,
  headerCenter,
  headerRight,
  className,
}: ContainerPanelHeaderProps) {
  const toggleContainerMaximized = useLayoutStore((s) => s.toggleContainerMaximized);
  const setContainerVisible = useLayoutStore((s) => s.setContainerVisible);
  const containers = useLayoutStore((s) => s.containers);

  const getContainerByPath = (p?: string): LayoutContainer | undefined => {
    if (!p) return undefined;
    const parts = p.split('.');
    let current: any = containers;
    for (const part of parts) {
      if (!current) return undefined;
      current = current[part];
    }
    return current;
  };

  const storeContainer = path ? getContainerByPath(path) : undefined;

  const isMaximized = isMaximizedProp ?? storeContainer?.maximizeContainer?.isMaximized;
  const isMaximizable = isMaximizableProp ?? storeContainer?.maximizeContainer?.isMaximizable ?? true;
  const isHiddable = isHiddableProp ?? storeContainer?.isHiddable ?? true;

  const computedLeft = headerLeft || (
    typeof title === 'string' ? (
      <span className="font-bold uppercase tracking-wider truncate text-foreground">{title}</span>
    ) : (
      title
    )
  );

  const computedRight = (
    <div className="flex items-center gap-1">
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
      className={`px-3 h-8 bg-muted/60 border-b border-border text-[11px] font-mono text-muted-foreground select-none shrink-0 ${className || ''}`}
      left={computedLeft}
      center={headerCenter}
      right={computedRight}
    />
  );
}

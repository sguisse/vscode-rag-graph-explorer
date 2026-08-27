import React from 'react';
import { Maximize2, Minimize2, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLayoutStore } from '@/store/useLayoutStore';
import { LeftCenterRightPanel } from '@/components/app/left-center-right-panel';

export interface ContainerPanelHeaderProps {
  id?: string;
  title?: React.ReactNode;
  path: string;
  isHiddable?: boolean;
  headerLeft?: React.ReactNode;
  headerCenter?: React.ReactNode;
  headerRight?: React.ReactNode;
  className?: string;
}

// Helper to safely extract container by dot-notated path
function getContainerFromState(state: any, path: string) {
  if (!path || !state) return undefined;
  if (typeof state.getContainerByPath === 'function') {
    return state.getContainerByPath(path);
  }
  if (state.containers) {
    return path.split('.').reduce((acc: any, key: string) => acc?.[key], state.containers);
  }
  return undefined;
}

export function ContainerPanelHeader({
  id,
  title,
  path,
  isHiddable = true,
  headerLeft,
  headerCenter,
  headerRight,
  className = '',
}: ContainerPanelHeaderProps) {
  // Primitive Zustand selectors to force component re-renders when booleans toggle
  const isMaximized = useLayoutStore((state: any) => {
    const container = getContainerFromState(state, path);
    return Boolean(container?.maximizeContainer?.isMaximized);
  });

  const isMaximizable = useLayoutStore((state: any) => {
    const container = getContainerFromState(state, path);
    return container?.maximizeContainer?.isMaximizable ?? true;
  });

  const toggleContainerMaximized = useLayoutStore((state: any) => state.toggleContainerMaximized);
  const toggleContainerVisible = useLayoutStore((state: any) => state.toggleContainerVisible);

  const handleMaximizeToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof toggleContainerMaximized === 'function') {
      toggleContainerMaximized(path);
    }
  };

  const handleVisibleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof toggleContainerVisible === 'function') {
      toggleContainerVisible(path);
    }
  };

  const computedLeft = headerLeft || (
    typeof title === 'string' ? (
      <span className="font-bold text-foreground truncate">{title}</span>
    ) : (
      title
    )
  );

  const computedRight = (
    <div className="flex items-center gap-1">
      {headerRight}

      {isMaximizable && (
        <Button
          id={`btn-maximize-${path.replace(/\./g, '-')}`}
          size="icon-xs"
          variant="ghost"
          onClick={handleMaximizeToggle}
          className={
            isMaximized
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
              : "text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
          }
          data-tooltip={isMaximized ? "Restore Panel Size" : "Maximize Panel"}
        >
          {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </Button>
      )}

      {isHiddable && (
        <Button
          id={`btn-hide-${path.replace(/\./g, '-')}`}
          size="icon-xs"
          variant="ghost"
          onClick={handleVisibleToggle}
          className="hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
          data-tooltip="Hide panel"
        >
          <EyeOff size={13} />
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

export default ContainerPanelHeader;

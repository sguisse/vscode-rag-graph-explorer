import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { UmlClassNodeData, NODE_STYLE_REGISTRY, removeExtension } from './graph-common-shapes';

export const MinimizedClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;
  const displayName = removeExtension(data.name);

  let borderClass = style.border;
  let iconColor = style.iconColor;

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/80 animate-pulse shadow-lg shadow-amber-500/50';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-md shadow-red-500/20';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10';
    iconColor = 'text-amber-500 dark:text-amber-400';
  }

  return (
    <div
      className={`w-[150px] h-[32px] bg-card rounded shadow-md border-2 ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden flex items-center px-2 py-1 select-none pointer-events-none`}
      title={data.name}
    >
      <div className="flex justify-center items-center gap-1.5 w-full min-w-0 pointer-events-none">
        {/*
        <FileCode size={14} className={`${iconColor} shrink-0 pointer-events-none`} />
        */}
        <h4 className="font-mono font-bold text-foreground text-xs truncate pointer-events-none" title={data.name}>{displayName}</h4>
      </div>
    </div>
  );
};

export const MinimizedConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const displayName = removeExtension(data.name);

  let borderClass = 'border-amber-500';
  let iconColor = 'text-amber-100';

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/80 animate-pulse shadow-lg shadow-amber-500/50';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-md shadow-red-500/20';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10';
    iconColor = 'text-amber-500';
  }

  return (
    <div
      className={`w-[150px] h-[32px] bg-card rounded shadow-md border-2 ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden flex items-center px-2 py-1 select-none pointer-events-none`}
      title={data.name}
    >
      <div className="flex items-center gap-1.5 w-full min-w-0 pointer-events-none">
        <Settings size={14} className={`${iconColor} shrink-0 pointer-events-none`} />
        <h4 className="font-mono font-bold text-foreground text-xs truncate pointer-events-none" title={data.name}>{displayName}</h4>
      </div>
    </div>
  );
};

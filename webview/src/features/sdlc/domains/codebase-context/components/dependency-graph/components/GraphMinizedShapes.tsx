import React from 'react';
import { Settings } from 'lucide-react';
import { UmlClassNodeData, NODE_STYLE_REGISTRY, removeExtension } from './graph-common-shapes';
import { TARGET_PATH_NODES_RED_BORDER_CLASS } from '../constants/graph.constants';

export const MinimizedClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;
  const displayName = removeExtension(data.name);

  let borderClass = `border-2 ${style.border}`;
  let bgClass = 'bg-card';

  if (data.isFocused) {
    borderClass = 'border-2 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/80 animate-pulse shadow-lg shadow-amber-500/50';
  } else if (data.isOrigin) {
    borderClass = 'border-2 border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-md shadow-red-500/20';
    bgClass = 'bg-red-600 text-white';
  } else if (data.isTargetPath) {
    borderClass = `${TARGET_PATH_NODES_RED_BORDER_CLASS} border-red-500 dark:border-red-500 shadow-md shadow-red-500/20`;
    bgClass = 'bg-card';
  } else if (data.isDependency) {
    borderClass = 'border-2 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10';
  }

  return (
    <div
      className={`w-[150px] h-[32px] ${bgClass} rounded shadow-md ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden flex items-center px-2 py-1 select-none pointer-events-none`}
      title={data.name}
    >
      <div className="flex justify-center items-center gap-1.5 w-full min-w-0 pointer-events-none">
        <h4 className="font-mono font-bold text-foreground text-xs truncate pointer-events-none" title={data.name}>{displayName}</h4>
      </div>
    </div>
  );
};

export const MinimizedConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const displayName = removeExtension(data.name);

  let borderClass = 'border-2 border-amber-500';
  let iconColor = 'text-amber-100';
  let bgClass = 'bg-card';

  if (data.isFocused) {
    borderClass = 'border-2 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/80 animate-pulse shadow-lg shadow-amber-500/50';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-2 border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-md shadow-red-500/20';
    iconColor = 'text-white';
    bgClass = 'bg-red-600 text-white';
  } else if (data.isTargetPath) {
    borderClass = `${TARGET_PATH_NODES_RED_BORDER_CLASS} border-red-500 dark:border-red-500 shadow-md shadow-red-500/20`;
    iconColor = 'text-amber-500';
    bgClass = 'bg-card';
  } else if (data.isDependency) {
    borderClass = 'border-2 border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-md shadow-amber-500/10';
    iconColor = 'text-amber-500';
  }

  return (
    <div
      className={`w-[150px] h-[32px] ${bgClass} rounded shadow-md ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden flex items-center px-2 py-1 select-none pointer-events-none`}
      title={data.name}
    >
      <div className="flex items-center gap-1.5 w-full min-w-0 pointer-events-none">
        <Settings size={14} className={`${iconColor} shrink-0 pointer-events-none`} />
        <h4 className="font-mono font-bold text-foreground text-xs truncate pointer-events-none" title={data.name}>{displayName}</h4>
      </div>
    </div>
  );
};

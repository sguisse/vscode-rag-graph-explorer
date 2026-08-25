import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { UmlClassNodeData, NODE_STYLE_REGISTRY, removeExtension } from './graph-common-shapes';

export const RoundClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;
  const displayName = removeExtension(data.name);

  let borderClass = style.border;
  let bgClass = style.bg;

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-300 ring-4 ring-amber-400/80 animate-pulse scale-110 shadow-2xl shadow-amber-500/50';
    bgClass = 'bg-amber-500';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-400 ring-2 ring-red-500/60 shadow-lg shadow-red-500/30';
    bgClass = 'bg-red-600';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20';
    bgClass = 'bg-amber-600';
  }

  return (
    <div className="relative flex flex-col justify-center items-center w-16 h-16 pointer-events-none select-none">
      <div
        className={`w-16 h-16 rounded-full border-2 ${borderClass} ${bgClass} flex flex-col items-center justify-center shadow-lg transition-all duration-200 p-1 pointer-events-none`}
        title={data.name}
      >
        {/*
        <FileCode size={20} className="text-white pointer-events-none shrink-0" />
        */}
        <span className="px-0.5 max-w-[65px] font-mono font-bold text-[8px] text-white text-center truncate leading-tight pointer-events-none">
          {displayName}
        </span>
      </div>
      {/*
      <span
        className="-bottom-5 z-10 absolute bg-background/90 shadow-sm px-1.5 py-0.5 border border-border rounded max-w-[110px] font-mono font-semibold text-[9px] text-foreground truncate whitespace-nowrap pointer-events-none"
        title={data.name}
      >
        {displayName}
      </span>
      */}
    </div>
  );
};

export const RoundConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const displayName = removeExtension(data.name);

  let borderClass = 'border-amber-500';
  let bgClass = 'bg-amber-600';

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-300 ring-4 ring-amber-400/80 animate-pulse scale-110 shadow-2xl shadow-amber-500/50';
    bgClass = 'bg-amber-500';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-400 ring-2 ring-red-500/60 shadow-lg shadow-red-500/30';
    bgClass = 'bg-red-600';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/20';
    bgClass = 'bg-amber-600';
  }

  return (
    <div className="relative flex flex-col justify-center items-center w-16 h-16 pointer-events-none select-none">
      <div
        className={`w-16 h-16 rounded-full border-2 ${borderClass} ${bgClass} flex flex-col items-center justify-center shadow-lg transition-all duration-200 p-1 pointer-events-none`}
        title={data.name}
      >
        <Settings size={20} className="text-white pointer-events-none shrink-0" />
        <span className="px-0.5 max-w-[52px] font-mono font-bold text-[8px] text-white text-center truncate leading-tight pointer-events-none">
          {displayName}
        </span>
      </div>
      <span
        className="-bottom-5 z-10 absolute bg-background/90 shadow-sm px-1.5 py-0.5 border border-border rounded max-w-[110px] font-mono font-semibold text-[9px] text-foreground truncate whitespace-nowrap pointer-events-none"
        title={data.name}
      >
        {displayName}
      </span>
    </div>
  );
};

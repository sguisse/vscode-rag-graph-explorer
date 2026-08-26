import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { UmlClassNodeData, NODE_STYLE_REGISTRY } from './graph-common-shapes';

export const CondensedClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;

  let borderClass = style.border;
  let headerBg = `${style.bg} text-white`;
  let iconColor = style.iconColor;

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-background animate-pulse scale-105 shadow-2xl shadow-amber-500/50';
    headerBg = 'bg-amber-500/40 dark:bg-amber-500/45 text-foreground';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500 dark:text-amber-400';
  }

  const methodCount = data.methods?.length || 0;
  const attrCount = data.attributes?.length || 0;

  return (
    <div className={`w-43 bg-card rounded-md shadow-md border-2 ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden pointer-events-none select-none`} title={data.name}>
      <div className={`${headerBg} p-2 flex items-center justify-between gap-1.5 pointer-events-none`}>
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
          <FileCode size={14} className={`${iconColor} shrink-0 pointer-events-none`} />
          <h4 className="font-mono font-bold text-xs truncate pointer-events-none" title={data.name}>{data.name}</h4>
        </div>
      </div>
      <div className="flex justify-between items-center bg-muted/20 p-1.5 font-mono text-[10px] text-muted-foreground pointer-events-none">
        <span>Attr: <strong className="text-foreground">{attrCount}</strong></span>
        <span>Mth: <strong className="text-foreground">{methodCount}</strong></span>
        <span>LOC: <strong className="text-foreground">{data.size || 0}</strong></span>
      </div>
    </div>
  );
};

export const CondensedConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  let borderClass = 'border-amber-500';
  let headerBg = 'bg-amber-500 text-white';
  let iconColor = 'text-amber-100';

  if (data.isFocused) {
    borderClass = 'border-amber-400 dark:border-amber-400 ring-4 ring-amber-400/80 ring-offset-2 ring-offset-background animate-pulse scale-105 shadow-2xl shadow-amber-500/50';
    headerBg = 'bg-amber-500/40 dark:bg-amber-500/45 text-foreground';
    iconColor = 'text-amber-400';
  } else if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500';
  }

  const propCount = data.configProperties?.length || 0;

  return (
    <div className={`w-60 bg-card rounded-md shadow-md border-2 ${borderClass} relative transition-all duration-200 opacity-100 overflow-hidden pointer-events-none select-none`} title={data.name}>
      <div className={`flex justify-between items-center ${headerBg} p-2 pointer-events-none`}>
        <div className="flex items-center gap-1.5 min-w-0 pointer-events-none">
          <Settings size={14} className={`${iconColor} shrink-0 pointer-events-none`} />
          <h4 className="font-mono font-bold text-xs truncate pointer-events-none" title={data.name}>{data.name}</h4>
        </div>
        <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest shrink-0 pointer-events-none">
          {propCount} Keys
        </span>
      </div>
    </div>
  );
};

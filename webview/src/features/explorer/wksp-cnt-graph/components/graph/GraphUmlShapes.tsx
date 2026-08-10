import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { CodebaseFile, CodebaseAttribute, CodebaseMethod, ConfigProperty } from '@/shared/services/graph-rag-explorer';

export interface NodeStyle {
  bg: string;
  border: string;
  badge: string;
  iconColor: string;
}

export const NODE_STYLE_REGISTRY: Record<string, NodeStyle> = {
  component: {
    bg: 'bg-emerald-600 dark:bg-emerald-900/80',
    border: 'border-emerald-500',
    badge: '🎨 React Component',
    iconColor: 'text-emerald-400'
  },
  module: {
    bg: 'bg-purple-600 dark:bg-purple-950/80',
    border: 'border-purple-500',
    badge: '📦 Module / Service',
    iconColor: 'text-purple-400'
  },
  interface: {
    bg: 'bg-indigo-700 dark:bg-indigo-950/80',
    border: 'border-indigo-500',
    badge: '⚙️ Interface',
    iconColor: 'text-indigo-400'
  },
  class: {
    bg: 'bg-blue-600 dark:bg-blue-950/80',
    border: 'border-blue-500',
    badge: '☕ Class',
    iconColor: 'text-blue-400'
  },
  default: {
    bg: 'bg-slate-700 dark:bg-slate-900/80',
    border: 'border-slate-500',
    badge: '📄 Node / AST',
    iconColor: 'text-slate-400'
  }
};

export interface UmlClassNodeData extends CodebaseFile {
  isDimmed?: boolean;
  isOrigin?: boolean;
  isDependency?: boolean;
  impactedMembers?: string[];
  selectedMember?: string;
  onSelectMember: (nodeId: string, memberId: string) => void;
  attributesVisible?: boolean;
  methodsVisible?: boolean;
}

export interface FolderNodeProps {
  data: { label: string };
  isSelected?: boolean;
}

export const FolderNode: React.FC<FolderNodeProps> = ({ isSelected }) => (
  <div className={`w-full h-full rounded-lg transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`} />
);

export const UmlClassNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  const style = NODE_STYLE_REGISTRY[data.type] || NODE_STYLE_REGISTRY.default;

  let borderClass = style.border;
  let headerBg = `${style.bg} text-white`;
  let iconColor = style.iconColor;

  if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500 dark:text-amber-400';
  }

  return (
    <div className={`w-72 bg-card rounded-lg shadow-xl border-2 ${borderClass} relative transition-all duration-300 opacity-100`}>
      <div className={`${headerBg} p-3 relative rounded-t-[5px] transition-colors`}>
        <div className="flex justify-between items-center">
          <span className="bg-black/30 opacity-85 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">{style.badge}</span>
          <span className="opacity-60 font-mono text-[10px]">{data.language}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileCode size={18} className={iconColor} />
          <h4 className="font-mono font-bold text-sm truncate">{data.name}</h4>
        </div>
      </div>

      {data.attributesVisible && (
        <div className="bg-muted/30 p-2.5 border-border border-b">
          <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Attributes</div>
          {(!data.attributes || data.attributes.length === 0) ? (
            <div className="text-muted-foreground text-xs italic">no attributes available</div>
          ) : (
            <ul className="space-y-0.5 font-mono text-[11px] text-foreground/80">
              {data.attributes.map((attr: CodebaseAttribute, idx: number) => (
                <li key={idx} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{attr.visibility === 'private' ? '-' : attr.visibility === 'protected' ? '#' : '+'}</span>
                  {attr.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {data.methodsVisible && (
        <div className="p-2.5">
          <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Methods / Exports</div>
          <div className="space-y-2">
            {data.methods?.map((m: CodebaseMethod) => {
              const isMethodImpacted = data.impactedMembers && data.impactedMembers.includes(m.id);
              const isSelected = data.selectedMember === m.id;
              return (
                <div key={m.id} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, m.id); }}
                  className={`pointer-events-auto group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                    isSelected ? 'border-red-500 bg-red-500/20 text-foreground font-bold' : isMethodImpacted ? 'border-amber-500 bg-amber-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                  }`}
                >
                  <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export const ConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => {
  let borderClass = 'border-amber-500';
  let headerBg = 'bg-amber-500 text-white';
  let iconColor = 'text-amber-100';

  if (data.isOrigin) {
    borderClass = 'border-red-500 dark:border-red-500 ring-2 ring-red-500/60 shadow-lg shadow-red-500/20';
    headerBg = 'bg-red-500/30 dark:bg-red-500/35 text-foreground';
    iconColor = 'text-red-500 dark:text-red-400';
  } else if (data.isDependency) {
    borderClass = 'border-amber-400 dark:border-amber-500 ring-2 ring-amber-400/50 shadow-lg shadow-amber-500/10';
    headerBg = 'bg-amber-500/30 dark:bg-amber-500/35 text-foreground';
    iconColor = 'text-amber-500';
  }

  return (
    <div className={`w-80 bg-card rounded-lg shadow-xl border-2 ${borderClass} relative transition-all duration-300 opacity-100`}>
      <div className={`flex justify-between items-center ${headerBg} p-2.5 rounded-t-[5px] transition-colors`}>
        <div className="flex items-center gap-1.5">
          <Settings size={16} className={iconColor} />
          <h4 className="font-mono font-bold text-xs truncate">{data.name}</h4>
        </div>
        <span className="bg-black/20 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-widest">Configuration</span>
      </div>
      <div className="space-y-2 bg-black/90 p-3 max-h-64 overflow-y-auto font-mono text-[10px] text-slate-300">
        {data.configProperties?.map((prop: ConfigProperty) => {
          const isPropImpacted = data.impactedMembers && data.impactedMembers.includes(prop.key);
          const isSelected = data.selectedMember === prop.key;
          return (
            <div key={prop.key} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, prop.key); }}
              className={`pointer-events-auto group relative p-2 rounded border transition-all cursor-pointer ${
                isSelected ? 'border-red-500 bg-red-500/20 text-white' : isPropImpacted ? 'border-amber-500 bg-amber-950/50 text-amber-400' : 'border-slate-800 hover:bg-slate-900'
              }`}
            >
              <div className="font-semibold text-amber-400 truncate">{prop.key}:</div>
              <div className="pl-2 text-slate-400 truncate">{prop.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

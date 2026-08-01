import React from 'react';
import { FileCode, Settings } from 'lucide-react';
import { CodebaseFile, CodebaseAttribute, CodebaseMethod, ConfigProperty } from '@/backend/services/codebase';

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
  interface: {
    bg: 'bg-indigo-700 dark:bg-indigo-950/80',
    border: 'border-indigo-500',
    badge: '⚙️ Java Interface',
    iconColor: 'text-indigo-400'
  },
  class: {
    bg: 'bg-blue-600 dark:bg-blue-950/80',
    border: 'border-blue-500',
    badge: '☕ Java Class',
    iconColor: 'text-blue-400'
  },
  default: {
    bg: 'bg-blue-600 dark:bg-blue-950/80',
    border: 'border-blue-500',
    badge: '☕ Java Class',
    iconColor: 'text-blue-400'
  }
};

export interface UmlClassNodeData extends CodebaseFile {
  isDimmed?: boolean;
  impactedMembers?: string[];
  selectedMember?: string;
  onSelectMember: (nodeId: string, memberId: string) => void;
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

  return (
    <div className={`w-72 bg-card rounded-lg shadow-xl border-2 ${style.border} relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
      <div className={`${style.bg} p-3 text-white relative rounded-t-[5px]`}>
        <div className="flex justify-between items-center">
          <span className="bg-black/30 opacity-85 px-2 py-0.5 rounded font-mono text-[10px] uppercase tracking-wider">{style.badge}</span>
          <span className="opacity-60 font-mono text-[10px]">{data.language}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileCode size={18} className={style.iconColor} />
          <h4 className="font-mono font-bold text-sm truncate">{data.name}</h4>
        </div>
      </div>
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
      <div className="p-2.5">
        <div className="mb-1 font-bold text-[10px] text-muted-foreground uppercase">Methods / Exports</div>
        <div className="space-y-2">
          {data.methods?.map((m: CodebaseMethod) => {
            const isMethodImpacted = data.impactedMembers && data.impactedMembers.includes(m.id);
            const isSelected = data.selectedMember === m.id;
            return (
              <div key={m.id} onClick={(e) => { e.stopPropagation(); data.onSelectMember(id, m.id); }}
                className={`pointer-events-auto group relative flex items-center justify-between p-1.5 rounded border transition-all cursor-pointer ${
                  isSelected ? 'border-primary bg-primary/10' : isMethodImpacted ? 'border-orange-500 bg-orange-500/15 animate-pulse' : 'border-transparent hover:bg-muted'
                }`}
              >
                <span className="font-mono text-foreground/90 text-xs">+ {m.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const ConfigNode: React.FC<{ id: string; data: UmlClassNodeData }> = ({ id, data }) => (
  <div className={`w-80 bg-card rounded-lg shadow-xl border-2 border-amber-500 relative transition-all duration-300 ${data.isDimmed ? 'opacity-25' : 'opacity-100'}`}>
    <div className="flex justify-between items-center bg-amber-500 p-2.5 rounded-t-[5px] text-white">
      <div className="flex items-center gap-1.5">
        <Settings size={16} className="text-amber-100" />
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
              isSelected ? 'border-primary bg-primary/20 text-white' : isPropImpacted ? 'border-orange-500 bg-orange-950/50 text-orange-400' : 'border-slate-800 hover:bg-slate-900'
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

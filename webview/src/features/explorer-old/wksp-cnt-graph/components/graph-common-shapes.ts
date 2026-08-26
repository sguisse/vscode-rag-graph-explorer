import { CodebaseFile } from '@/shared/services/graph-rag-explorer';

export const removeExtension = (filename: string): string => {
  if (!filename) return '';
  return filename.replace(/\.[^/.]+$/, '');
};

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
  isFocused?: boolean;
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

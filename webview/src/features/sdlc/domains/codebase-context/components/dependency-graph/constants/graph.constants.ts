export const FOLDER_KEYS_REGISTERED_CONFIG = ['frontend', 'backend', 'config', 'other'] as const;

export interface FolderStyleToken {
  fill: string;
  text: string;
  iconColor: string;
}

export const FOLDER_THEME_REGISTRY_CONFIG: Record<string, FolderStyleToken> = {
  frontend: { fill: 'fill-yellow-500/20', text: 'text-yellow-500', iconColor: 'text-emerald-500' },
  backend: { fill: 'fill-indigo-500/20', text: 'text-indigo-500', iconColor: 'text-blue-500' },
  config: { fill: 'fill-amber-500/20', text: 'text-amber-500', iconColor: 'text-amber-500' },
  other: { fill: 'fill-slate-500/20', text: 'text-slate-500', iconColor: 'text-slate-500' },
  default: { fill: 'fill-slate-500/20', text: 'text-slate-500', iconColor: 'text-slate-500' }
};

export const TARGET_PATH_NODES_RED_BORDER_CLASS = 'border-[10px]';

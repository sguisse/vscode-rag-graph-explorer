export const FOLDER_KEYS_REGISTERED_CONFIG = ['frontend', 'backend', 'config'] as const;
export type RegisteredFolderKey = typeof FOLDER_KEYS_REGISTERED_CONFIG[number];

export const FOLDER_BASE_X_POSITIONS_CONFIG: Record<RegisteredFolderKey, number> = {
  frontend: 40,
  backend: 460,
  config: 1270
};

export const INITIAL_VISIBLE_FILES_CONFIG: Record<string, boolean> = {
  'OrderButton.tsx': true,
  'orderApi.ts': true,
  'OrderController.java': true,
  'Order.java': true,
  'OrderRepository.java': true,
  'JpaOrderRepository.java': true,
  'application.yml': true
};

export const NODE_DIMENSIONS_CONFIG = {
  config: { width: 320, height: 240, cssClass: 'w-80' },
  default: { width: 288, height: 280, cssClass: 'w-72' }
} as const;

export const GRAPH_THEME_COLOR_TOKENS_CONFIG = {
  impactedEdge: '#eab308',
  darkLine: '#475569',
  lightLine: '#cbd5e1',
  darkBorder: '#334155',
  lightBorder: '#cbd5e1',
  darkBackground: '#18181b',
  lightBackground: '#ffffff'
} as const;

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
